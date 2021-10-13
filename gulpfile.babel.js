/* eslint no-sync: off */
/* eslint no-console: off */
/* eslint no-process-env: off */

import del from 'del';
import path from 'path';
import glob from 'glob';
import { EOL } from 'os';
import execa from 'execa';
import less from 'gulp-less';
import csso from 'gulp-csso';
import gulpif from 'gulp-if';
import webpack from 'webpack';
import eslint from 'gulp-eslint';
import { promisify } from 'util';
import plumber from 'gulp-plumber';
import superagent from 'superagent';
import { runCLI } from '@jest/core';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { Docker } from 'docker-cli-js';
import sourcemaps from 'gulp-sourcemaps';
import { parse as parseEs5 } from 'acorn';
import realFavicon from 'gulp-real-favicon';
import LessAutoprefix from 'less-plugin-autoprefix';
import { src, dest, parallel, series, watch } from 'gulp';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import MomentLocalesPlugin from 'moment-locales-webpack-plugin';

if (process.env.ELMU_ENV === 'prod') {
  throw new Error('Tasks should not run in production environment!');
}

const TEST_MAILDEV_IMAGE = 'maildev/maildev:1.1.0';
const TEST_MAILDEV_CONTAINER_NAME = 'elmu-maildev';

const TEST_MONGO_IMAGE = 'mongo:4.2.11-bionic';
const TEST_MONGO_CONTAINER_NAME = 'elmu-mongo';

const TEST_MINIO_IMAGE = 'minio/minio:RELEASE.2020-12-18T03-27-42Z';
const TEST_MINIO_CONTAINER_NAME = 'elmu-minio';

const MINIO_ACCESS_KEY = 'UVDXF41PYEAX0PXD8826';
const MINIO_SECRET_KEY = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';

const FAVICON_DATA_FILE = 'favicon-data.json';

const optimize = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--optimized');
const verbous = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--verbous');
const fix = process.argv.includes('--fix');

const autoprefixOptions = {
  browsers: ['last 3 versions', 'Firefox ESR', 'IE 11']
};

const supportedLanguages = ['en', 'de'];

let server = null;
process.on('exit', () => server && server.kill());

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const ensureContainerRunning = async ({ containerName, runArgs, afterRun = () => Promise.resolve() }) => {
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

const downloadCountryList = async lang => {
  const res = await superagent.get(`https://raw.githubusercontent.com/umpirsky/country-list/master/data/${lang}/country.json`);
  await fs.writeFile(`./src/data/country-names/${lang}.json`, JSON.stringify(JSON.parse(res.text), null, 2), 'utf8');
};

const tasks = {};

tasks.clean = async function clean() {
  await del(['.tmp', 'dist', 'reports']);
};

function isFixed(file) {
  return fix && file.eslint?.fixed;
}

tasks.lint = function lint() {
  return src(['*.js', 'src/**/*.js', 'scripts/**'], { base: './' })
    .pipe(eslint({ fix }))
    .pipe(eslint.format())
    .pipe(gulpif(isFixed, dest('./')))
    .pipe(gulpif(!server, eslint.failAfterError()));
};

tasks.test = async function test() {
  const { results } = await runCLI({
    testEnvironment: 'node',
    projects: [__dirname],
    setupFiles: ['./src/test-setup.js'],
    setupFilesAfterEnv: ['./src/test-setup-after-env.js'],
    runInBand: true,
    coverage: true
  }, '.');
  if (!results.success) {
    throw Error(`${results.numFailedTests} test(s) failed`);
  }
};

tasks.testChanged = async function testChanged() {
  const { results } = await runCLI({
    testEnvironment: 'node',
    projects: [__dirname],
    setupFiles: ['./src/test-setup.js'],
    setupFilesAfterEnv: ['./src/test-setup-after-env.js'],
    onlyChanged: true
  }, '.');
  if (!results.success) {
    throw Error(`${results.numFailedTests} test(s) failed`);
  }
};

tasks.testWatch = function testWatch(done) {
  runCLI({
    testEnvironment: 'node',
    projects: [__dirname],
    setupFiles: ['./src/test-setup.js'],
    setupFilesAfterEnv: ['./src/test-setup-after-env.js'],
    watch: true
  }, '.');
  done();
};

tasks.copyIframeresizer = function copyIframeresizer() {
  return src('./node_modules/iframe-resizer/js/iframeResizer.contentWindow.*')
    .pipe(dest('static/scripts'));
};

tasks.bundleCss = function bundleCss() {
  return src('src/styles/main.less')
    .pipe(gulpif(!!server, plumber()))
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true, plugins: [new LessAutoprefix(autoprefixOptions)] }))
    .pipe(gulpif(optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist'));
};

tasks.bundleJs = async function bundleJs() {
  const entry = (await promisify(glob)('./src/bundles/*.js'))
    .map(bundleFile => path.basename(bundleFile, '.js'))
    .reduce((all, name) => ({ ...all, [name]: ['core-js', `./src/bundles/${name}.js`] }), {});

  const plugins = [
    new webpack.NormalModuleReplacementPlugin(/abcjs-import/, 'abcjs/midi'),
    new webpack.ProvidePlugin({ process: 'process/browser' }),
    new MomentLocalesPlugin({ localesToKeep: ['en', 'de', 'de-DE'] })
  ];

  if (optimize) {
    plugins.push(new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: '../reports/bundles.html',
      openAnalyzer: false
    }));
  }

  const commonChunkModules = new Set([
    '@ant-design',
    '@babel',
    'antd',
    'aurelia-dependency-injection',
    'aurelia-metadata',
    'aurelia-pal',
    'auto-bind',
    'core-js',
    'fbjs',
    'iconv-lite',
    'moment',
    'object-assign',
    'prop-types',
    'react',
    'react-dom',
    'regenerator-runtime'
  ]);

  const nonEs5Modules = [
    'acho',
    'ansi-styles',
    'array-shuffle',
    'aurelia-dependency-injection',
    'auto-bind',
    'chalk',
    'clipboard-copy',
    'color',
    'color-convert',
    'map-age-cleaner',
    'mem',
    'mime',
    'mimic-fn',
    'p-defer',
    'p-is-promise',
    'parse-ms',
    'pretty-bytes',
    'pretty-ms',
    'punycode',
    'thenby',
    'quick-lru',
    'react-compare-slider'
  ];

  const bundleConfigs = {
    entry,
    output: {
      filename: '[name].js'
    },
    target: ['web', 'es5'],
    mode: optimize ? 'production' : 'development',
    devtool: optimize ? 'source-map' : 'eval',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: new RegExp(`node_modules[\\/](?!(${nonEs5Modules.join('|')})[\\/]).*`),
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                ['@babel/preset-env', { forceAllTransforms: true }],
                '@babel/preset-react'
              ]
            }
          }
        }
      ]
    },
    resolve: {
      alias: {
        process: 'process'
      }
    },
    optimization: {
      minimize: !!optimize,
      moduleIds: 'named',
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
    node: {
      __filename: true
    },
    plugins
  };

  const stats = await promisify(webpack)(bundleConfigs);

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
};

tasks.faviconGenerate = function faviconGenerate(done) {
  realFavicon.generateFavicon({
    masterPicture: 'favicon.png',
    dest: 'static',
    iconsPath: '/',
    design: {
      ios: {
        pictureAspect: 'backgroundAndMargin',
        backgroundColor: '#ffffff',
        margin: '14%',
        assets: {
          ios6AndPriorIcons: false,
          ios7AndLaterIcons: false,
          precomposedIcons: false,
          declareOnlyDefaultIcon: true
        },
        appName: 'elmu'
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'noChange',
        backgroundColor: '#2b5797',
        onConflict: 'override',
        assets: {
          windows80Ie10Tile: false,
          windows10Ie11EdgeTiles: {
            small: false,
            medium: true,
            big: false,
            rectangle: false
          }
        },
        appName: 'elmu'
      },
      androidChrome: {
        pictureAspect: 'backgroundAndMargin',
        margin: '17%',
        backgroundColor: '#ffffff',
        themeColor: '#ffffff',
        manifest: {
          name: 'elmu',
          display: 'standalone',
          orientation: 'notSet',
          onConflict: 'override',
          declared: true
        },
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        }
      },
      safariPinnedTab: {
        pictureAspect: 'blackAndWhite',
        threshold: 71.09375,
        themeColor: '#5bbad5'
      }
    },
    settings: {
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: true,
      readmeFile: false,
      htmlCodeFile: false,
      usePathAsIs: false
    },
    versioning: {
      paramName: 'v',
      paramValue: 'cakfaagb'
    },
    markupFile: FAVICON_DATA_FILE
  }, async () => {
    const faviconData = await fs.readFile(FAVICON_DATA_FILE, 'utf8');
    const faviconDataPrettified = JSON.stringify(JSON.parse(faviconData), null, 2);
    await fs.writeFile(FAVICON_DATA_FILE, faviconDataPrettified, 'utf8');
    done();
  });
};

tasks.faviconCheckUpdate = async function faviconCheckUpdate(done) {
  const faviconData = await fs.readFile(FAVICON_DATA_FILE, 'utf8');
  const currentVersion = JSON.parse(faviconData).version;
  realFavicon.checkForUpdates(currentVersion, done);
};

tasks.build = parallel(tasks.bundleCss, tasks.bundleJs);

tasks.verifyEs5compat = async function verifyEs5compat() {
  const files = await promisify(glob)('dist/**/*.js');
  const errors = [];

  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const content = await fs.readFile(file, 'utf8');

    try {
      parseEs5(content, { ecmaVersion: 5 });
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
};

tasks.verify = parallel(tasks.verifyEs5compat);

tasks.countriesUpdate = async function countriesUpdate() {
  await Promise.all(supportedLanguages.map(downloadCountryList));
};

tasks.maildevUp = async function maildevUp() {
  await ensureContainerRunning({
    containerName: TEST_MAILDEV_CONTAINER_NAME,
    runArgs: `-d -p 8000:80 -p 8025:25 ${TEST_MAILDEV_IMAGE}`
  });
};

tasks.maildevDown = async function maildevDown() {
  await ensureContainerRemoved({
    containerName: TEST_MAILDEV_CONTAINER_NAME
  });
};

tasks.maildevReset = series(tasks.maildevDown, tasks.maildevUp);

tasks.mongoUp = async function mongoUp() {
  await ensureContainerRunning({
    containerName: TEST_MONGO_CONTAINER_NAME,
    runArgs: `-d -p 27017:27017 ${TEST_MONGO_IMAGE}`,
    afterRun: async () => {
      await execa('./scripts/db-create-user', { stdio: 'inherit' });
      await execa('./scripts/db-seed', { stdio: 'inherit' });
    }
  });
};

tasks.mongoDown = async function mongoDown() {
  await ensureContainerRemoved({
    containerName: TEST_MONGO_CONTAINER_NAME
  });
};

tasks.mongoReset = series(tasks.mongoDown, tasks.mongoUp);

tasks.mongoUser = async function mongoUser() {
  await execa('./scripts/db-create-user', { stdio: 'inherit' });
};

tasks.mongoSeed = async function mongoSeed() {
  await execa('./scripts/db-seed', { stdio: 'inherit' });
};

tasks.mongoMigrate = async function mongoMigrate() {
  await execa('./scripts/db-migrate', { stdio: 'inherit' });
};

tasks.minioUp = async function minioUp() {
  await ensureContainerRunning({
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
};

tasks.minioDown = async function minioDown() {
  await ensureContainerRemoved({
    containerName: TEST_MINIO_CONTAINER_NAME
  });
};

tasks.minioReset = series(tasks.minioDown, tasks.minioUp);

tasks.minioSeed = async function minioSeed() {
  await execa('./scripts/s3-seed', { stdio: 'inherit' });
};

tasks.startServer = function startServer(done) {
  server = spawn(process.execPath, ['src/index.js'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit'
  });
  server.once('exit', () => {
    server = null;
  });
  done();
};

tasks.restartServer = function restartServer(done) {
  if (server) {
    server.once('exit', () => {
      tasks.startServer(done);
    });
    server.kill();
  } else {
    tasks.startServer(done);
  }
};

tasks.serve = series(tasks.maildevUp, tasks.mongoUp, tasks.minioUp, tasks.build, tasks.startServer);

tasks.serveRestart = series(parallel(tasks.lint, tasks.testChanged, tasks.bundleJs), tasks.restartServer);

tasks.serveRestartRaw = series(tasks.bundleJs, tasks.restartServer);

tasks.ciPrepare = series(tasks.mongoUser, tasks.mongoSeed, tasks.minioSeed);

tasks.ci = series(tasks.clean, tasks.lint, tasks.test, tasks.build, tasks.verify);

tasks.setupWatchers = function setupWatchers(done) {
  watch(['src/**/*.{js,yml,json}'], tasks.serveRestart);
  watch(['src/**/*.less'], tasks.bundleCss);
  watch(['*.js'], tasks.lint);
  watch(['scripts/**'], tasks.lint);
  watch(['scripts/db-seed'], tasks.mongoSeed);
  watch(['scripts/s3-seed'], tasks.minioSeed);
  done();
};

tasks.setupWatchersRaw = function setupWatchersRaw(done) {
  watch(['src/**/*.{js,yml,json}'], tasks.serveRestartRaw);
  watch(['src/**/*.less'], tasks.bundleCss);
  watch(['scripts/db-seed'], tasks.mongoSeed);
  watch(['scripts/s3-seed'], tasks.minioSeed);
  done();
};

tasks.startWatch = series(tasks.serve, tasks.setupWatchers);

tasks.startWatchRaw = series(tasks.serve, tasks.setupWatchersRaw);

tasks.default = tasks.startWatchRaw;

module.exports = tasks;
