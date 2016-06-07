var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

// typescript
gulp.task('ts:build', function() {
	var tsconfig = require('./tsconfig.json');
  	var filesGLob = tsconfig.filesGlob;
  	return gulp.src(filesGLob)
	  .pipe(sourcemaps.init())
      .pipe(ts(tsconfig.compilerOptions))
	  .pipe(sourcemaps.write('.', {
		  sourceRoot: function(file) { return file.cwd + '\\src'; } 
		}))
      .pipe(gulp.dest('build'));
});

// watch stuff
gulp.task('watch', function() {
	gulp.watch('./src/**/*.ts', ['ts:build']);
});

// generic tasks
gulp.task('build', ['ts:build']);

// default task
//gulp.task('default', ['watch']);
