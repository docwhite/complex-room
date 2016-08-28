var connect = require('gulp-connect'),
    glob    = require('glob'),
    gulp    = require('gulp'),
    jade    = require('gulp-jade'),
    rename  = require('gulp-rename'),
    stylus  = require('gulp-stylus'),
    path    = require('path');


gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    livereload: true
  });
});


gulp.task('scripts', function() {
  gulp.src('src/js/*').pipe(gulp.dest('dist/js'));
});

gulp.task('vendor', function() {
  gulp.src('bower_components/jquery/dist/jquery.js').pipe(gulp.dest('dist/lib/jquery'));
  gulp.src('bower_components/gl-matrix/dist/gl-matrix.js').pipe(gulp.dest('dist/lib/gl-matrix'));
});

gulp.task('templates', function () {
  gulp.src('src/index.jade')
    .pipe(jade({locals: { message: "Hi from gulp" }}))
    .pipe(gulp.dest('./dist/'))
    .pipe(connect.reload());
  gulp.src('src/sketches/**/*.jade')
    .pipe(jade({locals: { message: "Hi from gulp" }}))
    .pipe(gulp.dest('dist/sketch'))
    .pipe(connect.reload());
});

gulp.task('style', function() {
  return gulp.src('src/styles/site.styl')
    .pipe(stylus())
    .pipe(gulp.dest('dist/css/'))
    .pipe(connect.reload());
})

gulp.task('watch', function() {
  gulp.watch(['src/*.jade', 'src/sketches/**/*.jade'], ['templates']);
  gulp.watch('src/styles/site.styl', ['style']);
  gulp.watch('src/js/*', ['scripts']);
});

gulp.task('build', ['vendor', 'scripts', 'templates', 'style']);

gulp.task('develop', ['build', 'connect', 'watch']);

gulp.task('default', ['build']);