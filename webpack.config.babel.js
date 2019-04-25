import fs from 'fs';
import path from 'path';
import jsYaml from 'js-yaml';
import _ from 'lodash';
import TsconfigPathsWebpackPlugin from 'tsconfig-paths-webpack-plugin';
import webpackNodeExternals from 'webpack-node-externals';
import webpack, { HotModuleReplacementPlugin } from 'webpack';
import StartServerWebpackPlugin from 'start-server-webpack-plugin';
import WebpackCleanObsoleteChunksPlugin from 'webpack-clean-obsolete-chunks';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

const config = jsYaml.load( fs.readFileSync( path.resolve( __dirname, 'webpack.config.yaml' ), 'utf8' ) );

const { loaders, configuration } = config;

const mode = 'development';

const hmrPath = 'webpack/hot/poll?100';

class DebugHooksPlugin {
	constructor( options = {} ) {
		options = _.merge( {}, {
			pluginName: 'DebugHooksPlugin'
		}, options );
		this.pluginName = options.pluginName;
		this.options = options;
		/** @type {Subject<{ pluginName: string, hookName: string, request: import('tsconfig-paths-webpack-plugin/lib/plugin').Request, resolveContext: import('tsconfig-paths-webpack-plugin/lib/plugin').ResolveContext }>} */
		this.hookCalled = new Subject;
		
	}

	/** @param {import('tsconfig-paths-webpack-plugin/lib/plugin').Resolver} resolver */
	apply( resolver ) {
		const { pluginName, hookCalled } = this;

		const hookNames = [ 'resolve' ]; // Object.keys( hooks );
		for( const hookName of hookNames ) {
			resolver
			.getHook( hookName )
			.tapAsync( { name: pluginName }, ( request, resolveContext, callback ) => {
				hookCalled.next( {
					pluginName,
					hookName,
					request,
					resolveContext
				} );
				callback();
			} );
		}
	}
}

const debugResolvePlugin = new DebugHooksPlugin( { pluginName: 'DebugResolveHooksPlugin' } );

debugResolvePlugin.hookCalled
.pipe( filter( ( { request } ) => /async-queue/.test( request.request ) ) )
// .pipe( filter( ( { hookName, args: [ arg1, arg2 ] } ) => hookName === 'resolved' ) )
// .pipe(
// 	filter( ( { args } ) =>
// 		args.some(
// 			arg => ( typeof arg === 'object' ) && Object.entries( arg ).some(
// 				( [ key, value ] ) => ( typeof value === 'string' ) && /async-queue/.test( value )
// 			)
// 		)
// 	)
// )
.subscribe( ( { pluginName, hookName, request, resolveContext } ) => {
	console.log( { hookName, request, resolveContext } );
	process.exit( 0 );
} );

/** @type {webpack.Configuration} */
module.exports = _.merge( {}, configuration, { mode }, /** @type {webpack.Configuration} */ ( {
	entry: {
		index: [
			...( mode === 'development' ? [ hmrPath ] : [] ),
			path.resolve( __dirname, 'src', 'index' )
		]
	},
	externals: [ webpackNodeExternals( { whitelist: [ hmrPath ] } ) ],
	module: {
		rules: [
			{ test: /\.ts$/, use: [ loaders.typescript ] },
			{ test: /\.ya?ml$/, use: [ loaders.yaml ] }
		]
	},
	plugins: [
		new WebpackCleanObsoleteChunksPlugin,
		...( mode === 'development' ? [
			new HotModuleReplacementPlugin,
			new StartServerWebpackPlugin( {
				args: [],
				keyboard: true,
				name: 'index.js',
				nodeArgs: [],
				signal: false
			} )
		] : [] )
	],
	resolve: {
		plugins: [
			// debugResolvePlugin,
			new TsconfigPathsWebpackPlugin
		]
	}
} ) );
