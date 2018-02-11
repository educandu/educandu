const del = require('del');
const gulp = require('gulp');
const jest = require('jest');
const gulpif = require('gulp-if');
const shell = require('gulp-shell');
const eslint = require('gulp-eslint');
const { MongoClient } = require('mongodb');

let isWatching = false;

gulp.task('clean', () => {
  return del(['dist']);
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!isWatching, eslint.failAfterError()));
});

gulp.task('test', () => {
  return jest.runCLI({ onlyChanged: true }, '.');
});

gulp.task('test:watch', () => {
  return jest.runCLI({ watch: true }, '.');
});

gulp.task('mongo:create', shell.task('docker run --name elmu-mongo -d -p 27017:27017 mongo:3.6.2'));

gulp.task('mongo:wait', done => setTimeout(done, 500));

gulp.task('mongo:user', async () => {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  await client.db('admin').addUser('elmu', 'elmu', { roles: ['readWriteAnyDatabase'] });
  await client.close();
});

gulp.task('mongo:up', gulp.series('mongo:create', 'mongo:wait', 'mongo:user'));

gulp.task('mongo:down', shell.task('docker rm -f elmu-mongo'));

gulp.task('watch', () => {
  isWatching = true;
  return gulp.watch(['**/*.js', '!node_modules/**'], gulp.parallel('lint', 'test'));
});

gulp.task('default', gulp.series('watch'));
