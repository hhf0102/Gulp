const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const minimist = require('minimist');
const gulpSequence = require('gulp-sequence')
const envOptions = {
  string: 'env',
  default: { env: 'develop' },
};
const options = minimist(process.argv.slice(2), envOptions);
console.log(options);


gulp.task('clean', function () {
  return gulp.src(['./tmp', './public'], { read: false })
    .pipe($.clean());
});


gulp.task('copyHTML', function() {
  return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public'));
});


gulp.task('jade', function () {
  gulp.src('./source/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      pretty: true,
    }))
    .pipe(gulp.dest('./public'))
    .pipe(browserSync.stream());
});


gulp.task('sass', function () {
  const plugins = [
    autoprefixer({ browsers: ['last 1 version'] }),
  ];
  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'prod', cleanCSS()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});


gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'prod', $.uglify({
          compress: {
            drop_console: true,
          },
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
);


gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: "./public",
      reloadDebounce: 1000,
    }
  });
});


gulp.task('image-min', () =>
    gulp.src('./source/images/*')
        .pipe($.if(options.env === 'prod', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
);


gulp.task('watch', function () {
  gulp.watch('./source/**/*.jade', ['jade']);
  gulp.watch('./source/**/*.scss', ['sass']);
  gulp.watch('./source/**/*.js', ['babel']);
});


gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'image-min', 'babel'));

gulp.task('default', ['jade', 'sass', 'babel', 'browser-sync', 'watch']);