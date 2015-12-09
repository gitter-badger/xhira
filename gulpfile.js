var gulp = require('gulp');
var clean = require('gulp-clean');
var phonegapBuild = require('gulp-phonegap-build');
var rename = require('gulp-rename');

gulp.task('dist-clean', function () {
    return gulp.src('./dist', { read: false }).pipe(clean());
});

gulp.task('phonegap-dist-copy', function () {
    return gulp.src(['./www/**/*', '!./www/cordova.js', '!./www/cordova_plugins.js'])
        .pipe(gulp.dest('./dist/phonegap'))
    ;
});

gulp.task('phonegap-dist-config', function () {
    return gulp.src('./build/phonegap-config.xml')
        .pipe(rename('config.xml'))

        .pipe(gulp.dest('./dist/phonegap'))
    ;
});

gulp.task('phonegap-dist', ['dist-clean', 'phonegap-dist-copy', 'phonegap-dist-config']);

gulp.task('phonegap-build', ['phonegap-dist'], function () {
    var buildSettings = require('./build/phonegap-build.json');
    var buildConfig = {
        appId: buildSettings.appId,
        keys: buildSettings.keys, 
        user: {
            token: buildSettings.userToken
        }
    };
    gulp.src('dist/phonegap/**/*')
        .pipe(phonegapBuild(buildConfig));
});

//gulp.task('phonegap-build-debug', function () {
//    gulp.src('dist/**/*')
//        .pipe(phonegapeBuild({
//        "appId": "1234",
//        "user": {
//            "email": "your.email@example.org",
//            "password": "yourPassw0rd"
//        }
//    }));
//});

//gulp.task('default', ['phonegap-build']);