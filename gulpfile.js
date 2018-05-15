/* eslint no-console: off */

const del = require('del');
const gulp = require('gulp');
const jest = require('jest');
const util = require('util');
const delay = require('delay');
const execa = require('execa');
const less = require('gulp-less');
const csso = require('gulp-csso');
const gulpif = require('gulp-if');
const webpack = require('webpack');
const eslint = require('gulp-eslint');
const { spawn } = require('child_process');
const { Docker } = require('docker-cli-js');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const TEST_MONGO_IMAGE = 'mvertes/alpine-mongo:3.4.10-0';
const TEST_MONGO_CONTAINER_NAME = 'elmu-mongo';

const optimize = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--optimize');

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
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(gulpif(optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle:js', async () => {
  const createBundleConfig = bundleName => {
    const plugins = optimize
      ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: `../reports/${bundleName}.html`,
          openAnalyzer: false
        })
      ]
      : [];

    return {
      entry: ['babel-polyfill', `./src/bundles/${bundleName}.js`],
      output: { filename: `${bundleName}.js` },
      mode: optimize ? 'production' : 'development',
      devtool: optimize ? 'source-map' : 'cheap-module-eval-source-map',
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader'
            }
          }
        ]
      },
      plugins: plugins
    };
  };

  const bundleConfigs = ['index', 'docs', 'doc'].map(createBundleConfig);

  const stats = await util.promisify(webpack)(bundleConfigs);

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
    await execa('./db-create-user');
    await execa('./db-seed');
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

gulp.task('mongo:user', () => execa('./db-create-user'));

gulp.task('mongo:seed', () => execa('./db-seed'));

gulp.task('serve', ['mongo:up', 'build'], startServer);

gulp.task('serve:restart', restartServer);

gulp.task('ci:prepare', done => runSequence('mongo:user', 'mongo:seed', done));

gulp.task('ci', done => runSequence('clean', 'lint', 'test', 'build', done));

gulp.task('watch', ['serve'], () => {
  gulp.watch(['**/*.js', '!dist/**', '!node_modules/**'], ['lint', 'test:changed', 'bundle:js', 'serve:restart']);
  gulp.watch(['**/*.less', '!node_modules/**'], ['bundle:css']);
  gulp.watch(['db-seed'], ['mongo:seed']);
});

gulp.task('default', ['watch']);
