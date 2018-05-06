/* eslint no-console: off */

const del = require('del');
const gulp = require('gulp');
const jest = require('jest');
const util = require('util');
const delay = require('delay');
const less = require('gulp-less');
const gulpif = require('gulp-if');
const webpack = require('webpack');
const initDb = require('./init-db');
const eslint = require('gulp-eslint');
const { spawn } = require('child_process');
const runSequence = require('run-sequence');
const { Docker } = require('docker-cli-js');

const TEST_MONGO_IMAGE = 'mvertes/alpine-mongo:3.4.10-0';
const TEST_MONGO_CONTAINER_NAME = 'elmu-mongo';

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
    Object.assign({ entry: './src/bundles/docs.js', output: { filename: 'docs.js' } }, webpackConfig),
    Object.assign({ entry: './src/bundles/doc.js', output: { filename: 'doc.js' } }, webpackConfig)
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

gulp.task('mongo:up', async () => {
  const docker = new Docker();
  const data = await docker.command('ps -a');
  const container = data.containerList.find(c => c.names === TEST_MONGO_CONTAINER_NAME);
  if (!container) {
    await docker.command(`run --name ${TEST_MONGO_CONTAINER_NAME} -d -p 27017:27017 ${TEST_MONGO_IMAGE}`);
    await delay(500);
    await initDb.createUser();
    await initDb.seed();
  } else if (!container.status.startsWith('Up')) {
    await docker.command(`restart ${TEST_MONGO_CONTAINER_NAME}`);
    await delay(500);
  }
});

gulp.task('mongo:down', async () => {
  const docker = new Docker();
  await docker.command(`rm -f ${TEST_MONGO_CONTAINER_NAME}`);
});

gulp.task('mongo:reset', done => runSequence('mongo:down', 'mongo:up', done));

gulp.task('mongo:user', initDb.createUser);

gulp.task('mongo:seed', initDb.seed);

gulp.task('serve', ['mongo:up', 'build'], startServer);

gulp.task('serve:restart', restartServer);

gulp.task('ci:prepare', done => runSequence('mongo:user', 'mongo:seed', done));

gulp.task('ci', done => runSequence('clean', 'lint', 'test', 'build', done));

gulp.task('watch', ['serve'], () => {
  gulp.watch(['**/*.js', '!dist/**', '!node_modules/**'], ['lint', 'test:changed', 'bundle:js', 'serve:restart']);
  gulp.watch(['**/*.less', '!node_modules/**'], ['bundle:css']);
});

gulp.task('default', ['watch']);
