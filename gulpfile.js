/* eslint no-sync: off */
/* eslint no-console: off */
/* eslint no-process-env: off */

const fs = require('fs');
const del = require('del');
const path = require('path');
const glob = require('glob');
const gulp = require('gulp');
const jest = require('jest');
const util = require('util');
const delay = require('delay');
const execa = require('execa');
const acorn = require('acorn');
const { EOL } = require('os');
const less = require('gulp-less');
const csso = require('gulp-csso');
const gulpif = require('gulp-if');
const webpack = require('webpack');
const eslint = require('gulp-eslint');
const plumber = require('gulp-plumber');
const { spawn } = require('child_process');
const { Docker } = require('docker-cli-js');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const LessAutoprefix = require('less-plugin-autoprefix');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

if (process.env.ELMU_ENV === 'prod') {
  throw new Error('Tasks should not run in production environment!');
}

const TEST_MAILDEV_IMAGE = 'djfarrelly/maildev:1.0.0-rc2';
const TEST_MAILDEV_CONTAINER_NAME = 'elmu-maildev';

const TEST_MONGO_IMAGE = 'mvertes/alpine-mongo:3.6.5-0';
const TEST_MONGO_CONTAINER_NAME = 'elmu-mongo';

const TEST_MINIO_IMAGE = 'minio/minio:RELEASE.2018-07-10T01-42-11Z';
const TEST_MINIO_CONTAINER_NAME = 'elmu-minio';

const MINIO_ACCESS_KEY = 'UVDXF41PYEAX0PXD8826';
const MINIO_SECRET_KEY = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';

const optimize = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--optimized');
const verbous = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--verbous');

const autoprefixOptions = {
  browsers: ['last 3 versions', 'Firefox ESR', 'IE 11']
};

let server = null;
process.on('exit', () => server && server.kill());
const startServer = () => {
  server = spawn(process.execPath, ['src/index.js'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit'
  });
  server.once('exit', () => {
    server = null;
  });
};
const restartServer = done => {
  if (server) {
    server.once('exit', () => {
      startServer();
      done();
    });
    server.kill();
  } else {
    startServer();
    done();
  }
};

const ensureContainerRunning = async ({ containerName, runArgs, afterRun = (() => Promise.resolve()) }) => {
  const docker = new Docker();
  const data = await docker.command('ps -a');
  const container = data.containerList.find(c => c.names === containerName);
  if (!container) {
    await docker.command(`run --name ${containerName} ${runArgs}`);
    await delay(1000);
    await afterRun();
  } else if (!container.status.startsWith('Up')) {
    await docker.command(`restart ${containerName}`);
    await delay(1000);
  }
};

const ensureContainerRemoved = async ({ containerName }) => {
  const docker = new Docker();
  try {
    await docker.command(`rm -f ${containerName}`);
    await delay(1000);
  } catch (err) {
    if (!err.toString().includes('No such container')) {
      throw err;
    }
  }
};

gulp.task('clean', () => {
  return del(['.tmp', 'dist', 'reports']);
});

gulp.task('lint', () => {
  return gulp.src(['*.js', 'src/**/*.{js,jsx}', 'scripts/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!server, eslint.failAfterError()));
});

gulp.task('test', async () => {
  const { results } = await jest.runCLI({ testEnvironment: 'node' }, '.');
  if (!results.success) {
    throw Error(`${results.numFailedTests} test(s) failed`);
  }
});

gulp.task('test:changed', () => {
  return jest.runCLI({ testEnvironment: 'node', onlyChanged: true }, '.');
});

gulp.task('test:watch', () => {
  return jest.runCLI({ testEnvironment: 'node', watch: true }, '.');
});

gulp.task('copy:iframeresizer', () => {
  return gulp.src('./node_modules/iframe-resizer/js/iframeResizer.contentWindow.*')
    .pipe(gulp.dest('static/scripts'));
});

gulp.task('bundle:css', () => {
  return gulp.src('src/styles/main.less')
    .pipe(gulpif(!!server, plumber()))
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true, plugins: [new LessAutoprefix(autoprefixOptions)] }))
    .pipe(gulpif(optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle:js', async () => {
  const entry = glob.sync('./src/bundles/*.js')
    .map(bundleFile => path.basename(bundleFile, '.js'))
    .reduce((all, name) => ({ ...all, [name]: ['babel-polyfill', `./src/bundles/${name}.js`] }), {});

  const plugins = optimize
    ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: '../reports/bundles.html',
        openAnalyzer: false
      })
    ]
    : [];

  const commonChunkModules = new Set([
    'babel-polyfill',
    'babel-runtime',
    'core-js',
    'regenerator-runtime',
    'object-assign',
    'aurelia-dependency-injection',
    'aurelia-metadata',
    'aurelia-pal',
    'react',
    'react-dom',
    'fbjs',
    'prop-types',
    'auto-bind'
  ]);

  const bundleConfigs = {
    entry: entry,
    output: {
      filename: '[name].js'
    },
    mode: optimize ? 'production' : 'development',
    devtool: optimize ? 'source-map' : 'cheap-module-eval-source-map',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules[\\/](?!(auto-bind|mem|mimic-fn|p-is-promise|pretty-bytes|quick-lru)[\\/]).*/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: ({ resource }) => {
              const segments = path.relative(__dirname, resource || './').split(path.sep);
              return segments[0] === 'node_modules' && commonChunkModules.has(segments[1]);
            },
            name: 'commons',
            chunks: 'all'
          }
        }
      }
    },
    performance: {
      hints: optimize && 'warning',
      maxAssetSize: 500000,
      maxEntrypointSize: 500000
    },
    plugins: plugins
  };

  const stats = await util.promisify(webpack)(bundleConfigs);

  const minimalStatsOutput = {
    builtAt: false,
    chunks: false,
    colors: true,
    entrypoints: false,
    hash: false,
    modules: false,
    timings: false,
    version: false
  };

  console.log(stats.toString(verbous ? {} : minimalStatsOutput));
});

gulp.task('build', ['bundle:css', 'bundle:js']);

gulp.task('verify:es5compat', () => {
  const files = glob.sync('dist/**/*.js');
  const errors = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    try {
      acorn.parse(content, { ecmaVersion: 5 });
    } catch (error) {
      errors.push({ file, error });
    }
  }

  if (errors.length) {
    const lines = [];
    lines.push('Verification error, ES5 compatibility is broken:');
    for (const err of errors) {
      lines.push(err.error.message);
      lines.push(`  --> in: ${err.file}`);
    }

    throw new Error(lines.join(EOL));
  }
});

gulp.task('verify', ['verify:es5compat']);

gulp.task('maildev:up', () => {
  return ensureContainerRunning({
    containerName: TEST_MAILDEV_CONTAINER_NAME,
    runArgs: `-d -p 8000:80 -p 8025:25 ${TEST_MAILDEV_IMAGE}`
  });
});

gulp.task('maildev:down', () => {
  return ensureContainerRemoved({
    containerName: TEST_MAILDEV_CONTAINER_NAME
  });
});

gulp.task('maildev:reset', done => runSequence('maildev:down', 'maildev:up', done));

gulp.task('mongo:up', () => {
  return ensureContainerRunning({
    containerName: TEST_MONGO_CONTAINER_NAME,
    runArgs: `-d -p 27017:27017 ${TEST_MONGO_IMAGE}`,
    afterRun: async () => {
      await execa('./scripts/db-create-user', { stdio: 'inherit' });
      await execa('./scripts/db-seed', { stdio: 'inherit' });
    }
  });
});

gulp.task('mongo:down', () => {
  return ensureContainerRemoved({
    containerName: TEST_MONGO_CONTAINER_NAME
  });
});

gulp.task('mongo:reset', done => runSequence('mongo:down', 'mongo:up', done));

gulp.task('mongo:user', () => execa('./scripts/db-create-user', { stdio: 'inherit' }));

gulp.task('mongo:seed', () => execa('./scripts/db-seed', { stdio: 'inherit' }));

gulp.task('mongo:migrate', () => execa('./scripts/db-migrate', { stdio: 'inherit' }));

gulp.task('minio:up', () => {
  return ensureContainerRunning({
    containerName: TEST_MINIO_CONTAINER_NAME,
    runArgs: [
      '-d',
      '-p 9000:9000',
      `-e MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}`,
      `-e MINIO_SECRET_KEY=${MINIO_SECRET_KEY}`,
      '-e MINIO_BROWSER=on',
      `${TEST_MINIO_IMAGE} server /data`
    ].join(' '),
    afterRun: async () => {
      await execa('./scripts/s3-seed', { stdio: 'inherit' });
    }
  });
});

gulp.task('minio:down', () => {
  return ensureContainerRemoved({
    containerName: TEST_MINIO_CONTAINER_NAME
  });
});

gulp.task('minio:reset', done => runSequence('minio:down', 'minio:up', done));

gulp.task('minio:seed', () => execa('./scripts/s3-seed', { stdio: 'inherit' }));

gulp.task('serve', ['maildev:up', 'mongo:up', 'minio:up', 'build'], startServer);

gulp.task('serve:restart', ['lint', 'test:changed', 'bundle:js'], restartServer);

gulp.task('serve:restart:raw', ['bundle:js'], restartServer);

gulp.task('ci:prepare', done => runSequence('mongo:user', 'mongo:seed', 'minio:seed', done));

gulp.task('ci', done => runSequence('clean', 'lint', 'test', 'build', 'verify', done));

gulp.task('watch', ['serve'], () => {
  gulp.watch(['src/**/*.{js,jsx}'], ['serve:restart']);
  gulp.watch(['src/**/*.less'], ['bundle:css']);
  gulp.watch(['*.js'], ['lint']);
  gulp.watch(['scripts/**'], ['lint']);
  gulp.watch(['scripts/db-seed'], ['mongo:seed']);
  gulp.watch(['scripts/s3-seed'], ['minio:seed']);
});

gulp.task('watch:raw', ['serve'], () => {
  gulp.watch(['src/**/*.{js,jsx}'], ['serve:restart:raw']);
  gulp.watch(['src/**/*.less'], ['bundle:css']);
  gulp.watch(['scripts/db-seed'], ['mongo:seed']);
  gulp.watch(['scripts/s3-seed'], ['minio:seed']);
});

gulp.task('default', ['watch']);
