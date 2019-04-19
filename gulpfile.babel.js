import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gulpIgnore from 'gulp-ignore';
import del from 'del';
import typescript from 'gulp-typescript';
import sourcemaps from 'gulp-sourcemaps';
import tslint from 'gulp-tslint';
import eslint from 'gulp-eslint';
import istanbul from 'gulp-istanbul';
import mocha from 'gulp-mocha';
import remapIstanbul from 'remap-istanbul/lib/gulpRemapIstanbul';
import coveralls from 'gulp-coveralls';
import minimist from 'minimist';

const options = minimist( process.argv.slice( 2 ), {
	boolean: [ 'fix', 'coverage' ],
	default: { coverage: true }
} );

gulp.task( 'clean:coverage', () =>
	del( [ 'coverage' ] )
);

gulp.task( 'clean:dist', () =>
	del( [ 'dist' ] )
);

gulp.task( 'clean', gulp.parallel( 'clean:coverage', 'clean:dist' ) );

gulp.task( 'build:ts', () => {
	const tsproj =
		typescript.createProject( 'tsconfig.json', {
			typescript: require( 'typescript' )
		} );
	return tsproj.src()
		.pipe( sourcemaps.init() )
		.pipe( tsproj() )
		.pipe( sourcemaps.write( '.', { sourceRoot: tsproj.options.rootDir } ) )
		.pipe( gulp.dest( tsproj.options.outDir ) );
} );

gulp.task( 'build', gulp.series( 'build:ts' ) );

gulp.task( 'lint:tslint', () =>
	gulp.src( [ 'src/**/*.ts' ] )
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

gulp.task( 'lint', gulp.parallel( 'lint:tslint', 'lint:eslint' ) );

gulp.task( 'test:pre-istanbul', () =>
	gulp.src( 'dist/**/*.js' )
	.pipe( gulpIgnore.exclude( !options.coverage ) )
	.pipe( istanbul() )
	.pipe( istanbul.hookRequire() )
);

gulp.task( 'test:mocha', () =>
	gulp.src( 'test/**/*.spec.js' )
	.pipe( mocha( { reporter: 'spec' } ) )
	.pipe( gulpIf( options.coverage, istanbul.writeReports() ) )
	.pipe( gulpIf( options.coverage, istanbul.enforceThresholds( {
		thresholds: { global: 10 }
	} ) ) )
);

gulp.task( 'test:istanbul', () =>
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

gulp.task( 'test:coveralls', () =>
	gulp.src( 'coverage/lcov.info' )
	.pipe( gulpIgnore.exclude( !options.coverage ) )
	.pipe( gulpIf( process.env.CI, coveralls() ) )
);

gulp.task( 'test', gulp.series( 'clean:coverage', 'test:pre-istanbul', 'test:mocha', 'test:istanbul', 'test:coveralls' ) );

gulp.task( 'default', gulp.series( 'clean', 'build' ) );
