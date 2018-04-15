/* eslint no-console: off */

const del = require('del');
const gulp = require('gulp');
const jest = require('jest');
const util = require('util');
const less = require('gulp-less');
const gulpif = require('gulp-if');
const webpack = require('webpack');
const shell = require('gulp-shell');
const initDb = require('./init-db');
const eslint = require('gulp-eslint');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');
const runSequence = require('run-sequence');

const TEST_MONGO_IMAGE = 'mvertes/alpine-mongo:3.4.10-0';

let server = null;
process.on('exit', () => server && server.kill());
const startServer = () => {
  server = spawn(process.execPath, ['src/index.js'], {
    env: { NODE_ENV: 'development' },
    stdio: 'inherit'
  });
};
const restartServer = done => {
  server.once('exit', () => {
    startServer();
    done();
  });
  server.kill();
};

gulp.task('clean', () => {
  return del(['dist']);
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!server, eslint.failAfterError()));
});

gulp.task('test', () => {
  return jest.runCLI({}, '.');
});

gulp.task('test:changed', () => {
  return jest.runCLI({ onlyChanged: true }, '.');
});

gulp.task('test:watch', () => {
  return jest.runCLI({ watch: true }, '.');
});

gulp.task('bundle:css', () => {
  return gulp.src('src/styles/main.less')
    .pipe(less())
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle:js', async () => {
  const webpackConfig = {
    mode: 'production'
  };

  const stats = await util.promisify(webpack)([
    Object.assign({ entry: './src/bundles/index.js', output: { filename: 'index.js' } }, webpackConfig),
    Object.assign({ entry: './src/bundles/article.js', output: { filename: 'article.js' } }, webpackConfig),
    Object.assign({ entry: './src/bundles/articles.js', output: { filename: 'articles.js' } }, webpackConfig)
  ]);

  console.log(stats.toString({ chunks: false, colors: true }));

  if (stats.hasErrors()) {
    stats.toJson().errors.forEach(error => console.error(error));
  }

  if (stats.hasWarnings()) {
    stats.toJson().warnings.forEach(warning => console.warn(warning));
  }
});

gulp.task('build', ['bundle:css', 'bundle:js']);

gulp.task('mongo:create', shell.task(`docker run --name elmu-mongo -d -p 27017:27017 ${TEST_MONGO_IMAGE}`));

gulp.task('mongo:seed', initDb);

gulp.task('mongo:wait', done => setTimeout(done, 500));

gulp.task('mongo:user', async () => {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  await client.db('admin').addUser('elmu', 'elmu', { roles: ['readWriteAnyDatabase'] });
  await client.close();
});

gulp.task('mongo:up', done => runSequence('mongo:create', 'mongo:wait', 'mongo:user', 'mongo:seed', done));

gulp.task('mongo:down', shell.task('docker rm -f elmu-mongo'));

gulp.task('serve', ['build'], startServer);

gulp.task('serve:restart', restartServer);

gulp.task('ci:prepare', done => runSequence('mongo:user', 'mongo:seed', done));

gulp.task('ci', done => runSequence('clean', 'test', 'build', done));

gulp.task('watch', ['serve'], () => {
  gulp.watch(['**/*.js', '!dist/**', '!node_modules/**'], ['lint', 'test:changed', 'bundle:js', 'serve:restart']);
  gulp.watch(['**/*.less', '!node_modules/**'], ['bundle:css']);
});

gulp.task('default', ['watch']);
