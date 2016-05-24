module.exports = function(grunt) {

    // Configure Grunt
    grunt.initConfig({

        // Access the package file contents for later use.
        pkg: grunt.file.readJSON('package.json'),

        requirejs: {
            compile: {
                options: {
                    mainConfigFile: "requirejs.config.js"
                }
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            amd: {
                src: 'dist/pytools.js',
                dest: 'dist/pytools.min.js'
            }
        },

        connect: {
            test: {
                options: {
                    port: 8000
                }
            }
        },

        jasmine: {
            taskName: {
                src: 'src/pytools/**/*.js',
                options: {
                    specs: 'test/spec/**/*-spec.js',
                    host: 'http://127.0.0.1:8000/',
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        requireConfigFile: 'requirejs.config.js'
                    }
                }
            }
        },

        tslint: {
            src: ['src/**/*.ts'],
            options: {
                configuration: 'tslint.json'
            }
        },

        // run jasmine tests any time watched files change
        watch: {
            files: ['src/**/*', 'test/spec/**/*'],
            tasks: ['jasmine']
        }
    });

    // Load external tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-yuidoc'); // enable the YUIDocs task.
    grunt.loadNpmTasks('grunt-complexity');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.registerTask('default', ['test', 'tslint', 'requirejs', 'uglify']);
    grunt.registerTask('test', ['connect:test', 'jasmine']);

};
