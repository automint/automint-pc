var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var minifyInline = require('gulp-minify-inline');
var size = require('gulp-size');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');
var mainBowerFiles = require('main-bower-files');
var jsonminify = require('gulp-jsonminify');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');

gulp.task('default', function() {
    console.log('Gulp is up and running.');
    runSequence(
        'clean',
        'root-dir-files',
        'app-dir',
        'assets-dir',
        'automint-modules',
        'bower_components',
        'data-dir',
        'node_modules',
        'oauth-dir'
    );
});

gulp.task('clean', function() {
    return del([
        'app'
    ]);
});

gulp.task('root-dir-files', function() {
    gulp.src('../src/index.html')
        .pipe(minifyInline())
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('app'));
    gulp.src(['../src/*.json', '!../src/typings.json'])
        .pipe(jsonminify())
        .pipe(gulp.dest('app'));
    gulp.src('../src/main.js')
        .pipe(gulp.dest('app'));
});

gulp.task('app-dir', function() {
    gulp.src('../src/app/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('app/app'));
    gulp.src('../src/app/**/*.html')
        .pipe(minifyInline())
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('app/app'));
});

gulp.task('assets-dir', function() {
    gulp.src('../src/assets/css/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('app/assets/css'));
    gulp.src('../src/assets/img/*')
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(gulp.dest('app/assets/img'));
    gulp.src('../src/assets/js/*')
        .pipe(gulp.dest('app/assets/js'));
    gulp.src('../src/assets/material-icons/*')
        .pipe(gulp.dest('app/assets/material-icons'));
});

gulp.task('automint-modules', function() {
    gulp.src('../src/automint_modules/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('app/automint_modules'));
    gulp.src('../src/automint_modules/**/*.json')
        .pipe(jsonminify())
        .pipe(gulp.dest('app/automint_modules'));
    gulp.src('../src/automint_modules/**/*.html')
        .pipe(minifyInline())
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('app/automint_modules'));
});

gulp.task('bower_components', function() {
    return gulp.src(mainBowerFiles({
            paths: '../src/',
            overrides: {
                "angular": {
                    main: './angular.min.js'
                },
                "angular-animate": {
                    main: './angular-animate.min.js'
                },
                "angular-aria": {
                    main: './angular-aria.min.js'
                },
                "angular-material": {
                    main: [
                        "angular-material.min.css",
                        "angular-material.min.js"
                    ]
                },
                "angular-material-data-table": {
                    main: [
                        "dist/md-data-table.min.js",
                        "dist/md-data-table.min.css"
                    ]
                },
                "angular-messages": {
                    main: './angular-messages.min.js'
                },
                "angular-sanitize": {
                    main: './angular-sanitize.min.js'
                },
                "angular-ui-router": {
                    main: './release/angular-ui-router.min.js'
                },
                "jquery": {
                    main: './dist/jquery.min.js'
                },
                "moment": {
                    main: './min/moment.min.js'
                },
                "oclazyload": {
                    main: './dist/ocLazyLoad.min.js'
                }
            }
        }), {
            base: '../src/bower_components'
        })
        .pipe(gulp.dest('app/bower_components'));
});

gulp.task('data-dir', function() {
    gulp.src('../src/data/*.json')
        .pipe(jsonminify())
        .pipe(gulp.dest('app/data'));
});

gulp.task('node_modules', function() {
    gulp.src('../src/node_modules/**/*', {
            base: '../src'
        })
        .pipe(gulp.dest('app'));
});

gulp.task('oauth-dir', function() {
    gulp.src('../src/oauth/**/*.json')
        .pipe(jsonminify())
        .pipe(gulp.dest('app/oauth'));
});