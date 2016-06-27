/* jshint node: true, esversion: 6 */
const gulp = require( 'gulp' ),
	gulpIf = require( 'gulp-if' ),
	gulpIgnore = require( 'gulp-ignore' ),
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
		boolean: [ 'fix', 'coverage' ],
		default: { coverage: true }
	} );

gulp.task( 'clean:coverage', () =>
	gulp.src( [ 'coverage' ] )
	.pipe( clean() )
);

gulp.task( 'clean:out', () =>
	gulp.src( [ 'out' ] )
	.pipe( clean() )
);

gulp.task( 'clean:typings', () =>
	gulp.src( [ 'typings' ] )
	.pipe( clean() )
);

gulp.task( 'clean', [ 'clean:coverage', 'clean:out', 'clean:typings' ] );

gulp.task( 'build:typings', [ 'clean:typings' ], () =>
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

gulp.task( 'pre-test:istanbul', [ 'clean:coverage' ], () =>
	gulp.src( 'out/**/*.js' )
	.pipe( gulpIgnore.exclude( !options.coverage ) )
	.pipe( istanbul() )
	.pipe( istanbul.hookRequire() )
);

gulp.task( 'pre-test', [ 'clean:coverage', 'pre-test:istanbul' ] );

gulp.task( 'test:mocha', [ 'pre-test' ], () =>
	gulp.src( 'test/**/*.spec.js' )
	.pipe( mocha( { reporter: 'spec' } ) )
	.pipe( gulpIf( options.coverage, istanbul.writeReports() ) )
	.pipe( gulpIf( options.coverage, istanbul.enforceThresholds( {
		thresholds: { global: 10 }
	} ) ) )
);

gulp.task( 'test:istanbul', [ 'clean:coverage', 'pre-test', 'test:mocha' ], () =>
	gulp.src( 'coverage/coverage-final.json' )
	.pipe( gulpIgnore.exclude( !options.coverage ) )
	.pipe( remapIstanbul( {
		fail: true,
		reports: {
			lcovonly: 'coverage/lcov.info',
			json: 'coverage/coverage-final.json'
		}
	} ) )
);

gulp.task( 'test:coveralls', [ 'pre-test', 'test:istanbul' ], () =>
	gulp.src( 'coverage/lcov.info' )
	.pipe( gulpIgnore.exclude( !options.coverage ) )
	.pipe( gulpIf( process.env.CI, coveralls() ) )
);

gulp.task( 'test', [ 'pre-test', 'test:mocha', 'test:istanbul', 'test:coveralls' ] );

gulp.task( 'default', [ 'build' ] );
