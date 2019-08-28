/*
 * プラグイン
 */
const gulp = require('gulp'),
  pug = require('gulp-pug'),
  plumber = require('gulp-plumber'), // エラー出てもタスク続行
  browserSync = require('browser-sync'),
  lec = require('gulp-line-ending-corrector'), // 文字コード,改行コード指定
  replace = require('gulp-replace'); // タイムスタンプ付与用

// css系
const stylus = require('gulp-stylus'),
  autoprefixer  = require('gulp-autoprefixer'),
  clean  = require('gulp-clean-css'), // min化
  gcmq = require('gulp-group-css-media-queries'); // メディアクエリをまとめる

// js系
const include  = require('gulp-include'),
  babel  = require('gulp-babel'), // ES6
  uglify  = require('gulp-uglify-es').default; // JSmin化

// 画像圧縮系
const imgmin = require('gulp-imagemin'),
  imgminPNG = require('imagemin-pngquant'),
  imgminJPG = require('imagemin-jpeg-recompress'),
  imgminGIF = require('imagemin-gifsicle'),
  imgminSVG = require('gulp-svgmin');

/*
 * 変数定義
 */
// 各パス
const path = {
  '_re' : '_resources/',
  'dist' : 'dist/',
}
// 各ファイル
const files = {
  'STYLUS': path._re + 'css/*.styl',
  'RE_STYLUS': [path._re + 'css/**/_*.styl'],
  'CSS': path.dist + 'assets/css/**/*.css',
  'PUG': [path._re + 'html/**/*.pug', '!' + path._re + 'html/**/_*.pug'],
  'PUG_ALL': path._re + 'html/**/*.pug',
  'HTML': path.dist + '**/*.html',
  'RE_JS': path._re + 'js/*.js',
  'JS': path.dist + 'assets/js/**/*.js',
  'IMG': path._re + 'img/**/*.+(jpg|jpeg|png|gif|svg)'
}
// 各出力フォルダ
const folder = {
  'IMG': path.dist + 'assets/img/',
  'CSS': path.dist + 'assets/css/',
  'HTML': path.dist,
  'JS': path.dist + 'assets/js/',
}
// フォルダの位置指定
const place = {
  'PUG': path._re + 'html/'
}
// CSSキャッシュ対策 タイムスタンプ付与
const timeStamp = ""; //付与しない場合はこちら
// const timeStamp = Date.now();
/*
 * CSSタスク
 */
function css() {
  return gulp
    .src(files.STYLUS)
    .pipe(plumber())
    .pipe(stylus({
      compress: true,
    }))
    .pipe(autoprefixer({ // ベンダープレフィックス付与 対応バージョン指定はpackage.jsonに記載
      cascade: false,
      grid: true,
    }))
    .pipe(gcmq()) // 複数個所のmedia-queryを一つにまとめる
    .pipe(lec({verbose:true, eolc: 'CRLF', encoding:'utf8'})) // 改行コード 文字コード指定
    .pipe(clean()) // min化
    .pipe(gulp.dest(folder.CSS)) // CSSのコンパイル先
    .pipe(browserSync.reload({stream: true})); // cssはreloadではなくstream
}

/*
 * HTMLタスク
 */
function html() {
  return gulp
    .src(files.PUG)
    .pipe(pug({
      basedir: place.PUG, // ルート相対パス可
      pretty: true // 整形
    }))
    .pipe(replace(/__NOCACHE__/g, timeStamp)) // __NOCACHE__という文字列をタイムスタンプに置換する
    .pipe(lec({verbose:true, eolc: 'CRLF', encoding:'utf8'})) // 改行コード 文字コード指定
    .pipe(gulp.dest(folder.HTML)); // htmlのコンパイル先
}

/*
 * jsタスク
 */
function js() {
  return gulp
    .src(files.RE_JS)
    .pipe(include())
    .pipe(babel({ // ES6変換
      presets: ['@babel/preset-env']
    }))
    .pipe(uglify({ // 圧縮
      output:{
        comments: /^!/ // /*!や//! で始まるコメントを残す(ライセンス)
      }
    }))
    .pipe(gulp.dest(folder.JS));　// jsのコンパイル先
}

/*
 * Browsersyncタスク
 */
function browsersync(done) {
  browserSync.init({
    server: {
      baseDir: folder.HTML,
      index: "index.html"
    }
  });
  done();
}

/*
 * ブラウザリロードタスク
 */
function bsReload(done) {
  browserSync.reload();
  done();
}

/*
 * 画像圧縮タスク
 */
function imagemin() {
  return gulp
    .src(files.IMG, {
      since: gulp.lastRun(imagemin)
    })
    .pipe(imgmin([
      imgminPNG({quality: [.6, .8], speed: 1}),
      imgminJPG(),
      imgminGIF({
        interlaced: false,
        optimizationLevel: 3,
        colors:180
          }),
          imgminSVG()
    ]))
    .pipe(imgmin()) // pngquantで暗くなる現象対応
    .pipe(gulp.dest(folder.IMG)); // img出力先
}

/*
 * watch
 */
function watch() {
  gulp.watch(files.RE_STYLUS, css);
  gulp.watch(files.PUG_ALL, html);
  gulp.watch(files.RE_JS, js);
  gulp.watch(files.IMG, imagemin);
  gulp.watch(files.HTML, bsReload);
  gulp.watch(files.JS, bsReload);
}

/*
 * gulpコマンドで実行される
 */
exports.default = gulp.series(
  gulp.parallel(css,html,js,imagemin),
  gulp.parallel(browsersync,watch,bsReload)
);
