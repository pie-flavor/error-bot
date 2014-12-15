module.exports = function( grunt ) {
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		tsdcfg: grunt.file.readJSON( 'tsd.json' ),
		opt: {
			srcDir: 'src',
			outDir: 'out',
			defDir: '<%= tsdcfg.path %>',
			referenceDef: '<%= opt.defDir %>/reference.d.ts'
		},
		clean: [
			[ '<%= opt.outDir %>//*',
				'!<%= opt.outDir %>/data',
				'!<%= opt.outDir %>/data//*'
			],
			[
				'<%= opt.defDir %>//*',
				'!<%= opt.defDir %>/all.d.ts',
				'<%= tsdcfg.bundle %>',
				'<%= opt.referenceDef %>'
			]
		],
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
				src: [ '<%= opt.srcDir %>/**/*.ts', '!<%= opt.srcDir %>/**/*.d.ts' ],
				outDir: '<%= opt.outDir %>',
				reference: '<%= opt.referenceDef %>'
			}
		}
	} );

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-tsd' );
	grunt.loadNpmTasks( 'grunt-ts' );

	grunt.registerTask( 'default', [ 'clean', 'tsd', 'ts' ] );
};
