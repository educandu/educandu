const del = require('del');
const gulp = require('gulp');
const jest = require('jest');
const less = require('gulp-less');
const gulpif = require('gulp-if');
const shell = require('gulp-shell');
const initDb = require('./init-db');
const eslint = require('gulp-eslint');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');
const runSequence = require('run-sequence');

const TEST_MONGO_IMAGE = 'mvertes/alpine-mongo:3.4.10-0';

let server = null;
process.on('exit', () => server && server.kill());
const spawnServer = () => {
  return spawn(process.execPath, ['src/index.js'], {
    env: { NODE_ENV: 'development' },
    stdio: 'inherit'
  });
};
const restartServer = done => {
  if (server) {
    server.once('exit', () => {
      server = spawnServer();
      done();
    });
    server.kill();
  } else {
    server = spawnServer();
    done();
  }
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

gulp.task('less', () => {
  return gulp.src('src/styles/main.less')
    .pipe(less())
    .pipe(gulp.dest('src/static'));
});

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

gulp.task('serve', restartServer);

gulp.task('ci:prepare', ['mongo:up']);

gulp.task('ci:cleanup', ['mongo:down']);

gulp.task('ci', done => runSequence('clean', 'test', done));

gulp.task('watch', ['serve'], () => {
  gulp.watch(['**/*.js', '!node_modules/**'], ['lint', 'test:changed', 'serve']);
  gulp.watch(['**/*.less', '!node_modules/**'], ['less']);
});

gulp.task('default', ['watch']);
