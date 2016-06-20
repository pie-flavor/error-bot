/* jshint node: true, esversion: 6 */
const gulp = require( 'gulp' ),
	gulpIf = require( 'gulp-if' ),
	clean = require( 'gulp-clean' ),
	typings = require( 'gulp-typings' ),
	typescript = require( 'gulp-typescript' ),
	sourcemaps = require( 'gulp-sourcemaps' ),
	tslint = require( 'gulp-tslint' ),
	eslint = require( 'gulp-eslint' ),
	istanbul = require( 'gulp-istanbul' ),
	mocha = require( 'gulp-mocha' ),
	remapIstanbul = require( 'remap-istanbul/lib/gulpRemapIstanbul' ),
	coveralls = require( 'gulp-coveralls' ),
	minimist = require( 'minimist' ),
	options = minimist( process.argv.slice( 2 ), {
		boolean: [ 'fix' ]
	} );

gulp.task( 'clean:out', () =>
	gulp.src( [ 'out/**/*' ] )
	.pipe( clean() )
);

gulp.task( 'clean', [ 'clean:out' ] );

gulp.task( 'build:typings', [ 'clean' ], () =>
	gulp.src( 'typings.json' )
	.pipe( typings() )
);

gulp.task( 'build:ts', [ 'clean', 'build:typings' ], () => {
	const tsproj = typescript.createProject( 'tsconfig.json', { typescript: require( 'typescript' ) } );
	return tsproj.src()
		.pipe( sourcemaps.init() )
		.pipe( typescript( tsproj ) )
		.pipe( sourcemaps.write( '.', { sourceRoot: tsproj.options.rootDir } ) )
		.pipe( gulp.dest( tsproj.options.outDir ) );
} );

gulp.task( 'build', [ 'clean', 'build:ts' ] );

gulp.task( 'lint:tslint', () =>
	gulp.src( [ 'src/**/*.ts', '!src/**/*.d.ts' ] )
	.pipe( tslint() )
	.pipe( tslint.report( 'verbose', {
		emitError: true,
		reportLimit: 0,
		summarizeFailureOutput: false
	} ) )
);

gulp.task( 'lint:eslint', () =>
	gulp.src( [
		'*.js',
		'*.json',
		'data/**/*.json',
		'src/**/*.js',
		'test/**/*.js'
	], { base: '.' } )
	.pipe( eslint( {
		fix: options.fix
	} ) )
	.pipe( eslint.format() )
	.pipe( gulpIf( file => file.eslint && file.eslint.fixed, gulp.dest( '.' ) ) )
	.pipe( eslint.failAfterError() )
);

gulp.task( 'lint', [ 'lint:tslint', 'lint:eslint' ] );

gulp.task( 'pre-test:istanbul', () =>
	gulp.src( 'out/**/*.js' )
	.pipe( istanbul() )
	.pipe( istanbul.hookRequire() )
);

gulp.task( 'pre-test', [ 'pre-test:istanbul' ] );

gulp.task( 'test:mocha', [ 'pre-test' ], () =>
	gulp.src( 'test/**/*.spec.js' )
	.pipe( mocha( { reporter: 'spec' } ) )
	.pipe( istanbul.writeReports() )
	.pipe( istanbul.enforceThresholds( {
		thresholds: { global: 10 }
	} ) )
);

gulp.task( 'test:istanbul', [ 'pre-test', 'test:mocha' ], () =>
	gulp.src( 'coverage/coverage-final.json' )
	.pipe( remapIstanbul( {
		fail: true,
		reports: {
			lcovonly: 'coverage/lcov.info',
			json: 'coverage/coverage-final.json'
		}
	} ) )
);

gulp.task( 'test:coveralls', [ 'pre-test', 'test:istanbul' ], () => {
	if( !process.env.CI ) {
		return;
	}

	return gulp.src( 'coverage/lcov.info' )
		.pipe( coveralls() );
} );

gulp.task( 'test', [ 'pre-test', 'test:mocha', 'test:istanbul', 'test:coveralls' ] );

gulp.task( 'default', [ 'build' ] );
