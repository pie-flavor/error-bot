module.exports = function( grunt ) {
	var pkg = grunt.file.readJSON( 'package.json' ),
		tsdcfg = grunt.file.readJSON( 'tsd.json'),
		opt = {
			srcDir: 'src',
			outDir: 'out',
			defDir: '<%= tsdcfg.path %>',
			referenceDef: '<%= opt.defDir %>/reference.d.ts'
		};

	grunt.initConfig( {
		pkg: pkg,
		tsdcfg: tsdcfg,
		opt: opt,
		clean: {
			before: [
				[
					'<%= opt.outDir %>//*',
					'!<%= opt.outDir %>/data',
					'!<%= opt.outDir %>/data//*'
				],
				[
					'<%= tsdcfg.bundle %>',
					'<%= opt.referenceDef %>'
				]
			],
			after: [ '**/.baseDir.*' ]
		},
		tsd: {
			refresh: {
				options: {
					command: 'reinstall',
					latest: true,
					overwrite: true,
					config: './tsd.json'
				}
			}
		},
		copy: {
			options: {},
			ts: {
				files: [ {
					expand: true,
					cwd: '<%= opt.srcDir %>',
					src: [ '**/*.ts' ],
					dest: '<%= opt.outDir %>',
					filter: 'isFile'
				} ],
				options: {
					process: function( contents, filename ) {
						if( /\.d\.ts$/i.test( filename ) ) return contents;
						else return '///ts:ref=all.d.ts\n' + contents;
					}
				}
			}
		},
		ts: {
			options: {
				fast: 'never',
				compile: true,
				comments: true,
				target: 'es5',
				module: 'commonjs',
				noImplicitAny: false,
				sourceRoot: '',
				maproot: '',
				declaration: false,
				verbose: true,
				failOnTypeErrors: false
			},
			default: {
				src: [ '<%= opt.outDir %>/**/*.ts' ],
				outDir: '<%= opt.outDir %>',
				reference: '<%= opt.referenceDef %>'
			}
		},
		version: {
			options: {
				pkg: pkg
			},
			settings: {
				src: [ '<%= opt.outDir %>/data/settings.json' ]
			}
		},
		vows: {
			all: {
				options: {
					reporter: 'spec'
				},
				src: '<%= opt.outDir %>/spec/**/*.js'
			}
		}
	} );

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-tsd' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-ts' );
	grunt.loadNpmTasks( 'grunt-version' );
	grunt.loadNpmTasks( 'grunt-vows-runner' );

	grunt.registerTask( 'default', [ 'clean:before', 'copy', 'tsd', 'ts', 'version', 'clean:after', 'vows' ] );
};
