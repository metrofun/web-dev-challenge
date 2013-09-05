"use strict";
module.exports = function (grunt) {

    grunt.initConfig({
        watch: {
            project: {
                files: [
                    'modules/*/*.js',
                    'modules/*/*.css'
                ],
                tasks: ['concat:js', 'concat:css']
            }
        },
        concat: {
            js: {
                src: [
                    'modules/*/*.js'
                ],
                dest: 'script.js'
            },
            css: {
                src: [
                    'modules/*/*.css'
                ],
                dest: 'style.css'
            }
        },
        clean: {
            project: ['<%= concat.js.dest %>']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['concat', 'watch:project']);

};
