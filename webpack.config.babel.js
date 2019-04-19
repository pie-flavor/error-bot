import fs from 'fs';
import path from 'path';
import jsYaml from 'js-yaml';
import _ from 'lodash';
import TsconfigPathsWebpackPlugin from 'tsconfig-paths-webpack-plugin';
import webpackNodeExternals from 'webpack-node-externals';
import webpack, { ProvidePlugin } from 'webpack';

const config = jsYaml.load( fs.readFileSync( path.resolve( __dirname, 'webpack.config.yaml' ), 'utf8' ) );

const { loaders, configuration } = config;

const mode = 'development';

/** @type {webpack.Configuration} */
module.exports = _.merge( {}, configuration, /** @type {webpack.Configuration} */ ( {
	entry: {
		index: [ 'src/index' ]
	},
	mode,
	module: {
		rules: [
			{ test: /\.ts$/, use: [ loaders.typescript ] },
			{ test: /\.ya?ml$/, use: [ loaders.yaml ] }
		]
	},
	plugins: [
		new ProvidePlugin( {
			'performance.now': [ 'performance-now', 'default' ]
		} )
	],
	externals: [ webpackNodeExternals() ],
	resolve: {
		alias: {
			src: path.resolve( __dirname, 'src' )
		},
		plugins: [
			new TsconfigPathsWebpackPlugin
		]
	}
} ) );
