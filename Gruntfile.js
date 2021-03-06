module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: { },
        ignores: ['test/sample.js']
      }
    },
    exec: {
      vows: {
        cmd: function() {
          return './node_modules/vows/bin/vows test/*-test.js --spec --color';
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'exec:vows']
    },
    bower: {
      install: {
        options: {
          targetDir: './uml/lib'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower-task');

  grunt.registerTask('default', ['bower', 'jshint', 'exec:vows', 'watch']);
};
