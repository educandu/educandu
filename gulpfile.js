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

let server = null;

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

gulp.task('mongo:create', shell.task('docker run --name elmu-mongo -d -p 27017:27017 mongo:3.6.2'));

gulp.task('mongo:seed', initDb);

gulp.task('mongo:wait', done => setTimeout(done, 500));

gulp.task('mongo:user', async () => {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  await client.db('admin').addUser('elmu', 'elmu', { roles: ['readWriteAnyDatabase'] });
  await client.close();
});

gulp.task('mongo:up', gulp.series('mongo:create', 'mongo:wait', 'mongo:user', 'mongo:seed'));

gulp.task('mongo:down', shell.task('docker rm -f elmu-mongo'));

gulp.task('serve', done => {
  const createServer = () => {
    return spawn(process.execPath, ['src/index.js'], {
      env: { NODE_ENV: 'development' },
      stdio: 'inherit'
    });
  };
  if (server) {
    server.once('exit', () => {
      server = createServer();
      done();
    });
    server.kill();
  } else {
    server = createServer();
    process.on('exit', () => server.kill());
    done();
  }
});

// gulp.task('ci', gulp.series('mongo:up', 'test', 'mongo:down'));

gulp.task('ci', () => console.log('HELLO FROM GULP CI'));

gulp.task('watch:js', () => {
  gulp.watch(['**/*.js', '!node_modules/**'], gulp.parallel('lint', 'test:changed', 'serve'));
  gulp.watch(['**/*.less', '!node_modules/**'], gulp.parallel('less'));
});

gulp.task('watch', gulp.parallel('serve', 'watch:js'));

gulp.task('default', gulp.series('watch'));
