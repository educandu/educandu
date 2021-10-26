/* eslint-disable no-console, no-process-env, require-atomic-updates */
import url from 'url';
import del from 'del';
import path from 'path';
import gulp from 'gulp';
import glob from 'glob';
import { EOL } from 'os';
import execa from 'execa';
import fse from 'fs-extra';
import less from 'gulp-less';
import csso from 'gulp-csso';
import gulpif from 'gulp-if';
import esbuild from 'esbuild';
import eslint from 'gulp-eslint';
import { promisify } from 'util';
import plumber from 'gulp-plumber';
import EasyTable from 'easy-table';
import superagent from 'superagent';
import { promises as fs } from 'fs';
import Graceful from 'node-graceful';
import { spawn } from 'child_process';
import { Docker } from 'docker-cli-js';
import prettyBytes from 'pretty-bytes';
import sourcemaps from 'gulp-sourcemaps';
import realFavicon from 'gulp-real-favicon';
import LessAutoprefix from 'less-plugin-autoprefix';

if (process.env.ELMU_ENV === 'prod') {
  throw new Error('Tasks should not run in production environment!');
}

const ROOT_DIR = path.dirname(url.fileURLToPath(import.meta.url));

const TEST_MAILDEV_IMAGE = 'maildev/maildev:1.1.0';
const TEST_MAILDEV_CONTAINER_NAME = 'elmu-maildev';

const TEST_MONGO_IMAGE = 'bitnami/mongodb:4.2.17-debian-10-r23';
const TEST_MONGO_CONTAINER_NAME = 'elmu-mongo';

const TEST_MINIO_IMAGE = 'bitnami/minio:2020.12.18';
const TEST_MINIO_CONTAINER_NAME = 'elmu-minio';

const MINIO_ACCESS_KEY = 'UVDXF41PYEAX0PXD8826';
const MINIO_SECRET_KEY = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';

const FAVICON_DATA_FILE = 'favicon-data.json';

const optimize = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--optimize');
const verbose = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--verbose');

const autoprefixOptions = {
  browsers: ['last 2 versions']
};

const supportedLanguages = ['en', 'de'];

let server = null;
let buildResult = null;

Graceful.on('exit', () => {
  if (server) {
    server.kill();
  }
  if (buildResult) {
    buildResult.rebuild.dispose();
  }
});

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

function runJest(...flags) {
  return execa(process.execPath, [
    '--experimental-vm-modules',
    `${ROOT_DIR}/node_modules/jest/bin/jest.js`,
    ...flags.map(flag => `--${flag}`)
  ], { stdio: 'inherit' });
}

const downloadCountryList = async lang => {
  const res = await superagent.get(`https://raw.githubusercontent.com/umpirsky/country-list/master/data/${lang}/country.json`);
  await fs.writeFile(`./src/data/country-names/${lang}.json`, JSON.stringify(JSON.parse(res.text), null, 2), 'utf8');
};

export async function clean() {
  await del(['.tmp', 'dist', 'coverage', 'reports']);
}

export function lint() {
  return gulp.src(['*.js', 'src/**/*.js', 'scripts/**/*.js'], { base: './' })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!server, eslint.failAfterError()));
}

export function fix() {
  return gulp.src(['*.js', 'src/**/*.js', 'scripts/**/*.js'], { base: './' })
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(gulpif(file => file.eslint?.fixed, gulp.dest('./')))
    .pipe(eslint.failAfterError());
}

export function test() {
  return runJest('coverage', 'runInBand');
}

export function testChanged() {
  return runJest('onlyChanged');
}

export function testWatch() {
  return runJest('watch');
}

export function bundleCss() {
  return gulp.src('src/styles/main.less')
    .pipe(gulpif(!!server, plumber()))
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true, plugins: [new LessAutoprefix(autoprefixOptions)] }))
    .pipe(gulpif(optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

export async function bundleJs() {
  if (buildResult && buildResult.rebuild) {
    await buildResult.rebuild();
  } else {
    buildResult = await esbuild.build({
      entryPoints: await promisify(glob)('./src/bundles/*.js'),
      target: ['esnext', 'chrome95', 'firefox93', 'safari15', 'edge95'],
      format: 'esm',
      bundle: true,
      splitting: true,
      incremental: !!server,
      metafile: verbose,
      minify: optimize,
      loader: { '.js': 'jsx' },
      inject: ['./src/polyfills.js'],
      sourcemap: true,
      sourcesContent: true,
      outdir: './dist'
    });
  }

  if (buildResult.metafile) {
    await fse.mkdirp('./reports');
    await fs.writeFile('./reports/bundles.json', JSON.stringify(buildResult.metafile, null, 2), 'utf8');

    const t = new EasyTable();

    Object.entries(buildResult.metafile.outputs)
      .filter(([key]) => !key.endsWith('.map'))
      .forEach(([key, value]) => {
        t.cell('Bundle', key);
        t.cell('Size', prettyBytes(value.bytes), EasyTable.leftPadder(' '));
        t.newRow();
      });

    console.log(EOL + t.toString());
  }
}

export function faviconGenerate(done) {
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
}

export async function faviconCheckUpdate(done) {
  const faviconData = await fs.readFile(FAVICON_DATA_FILE, 'utf8');
  const currentVersion = JSON.parse(faviconData).version;
  realFavicon.checkForUpdates(currentVersion, done);
}

export const build = gulp.parallel(bundleCss, bundleJs);

export async function countriesUpdate() {
  await Promise.all(supportedLanguages.map(downloadCountryList));
}

export async function maildevUp() {
  await ensureContainerRunning({
    containerName: TEST_MAILDEV_CONTAINER_NAME,
    runArgs: `-d -p 8000:80 -p 8025:25 ${TEST_MAILDEV_IMAGE}`
  });
}

export async function maildevDown() {
  await ensureContainerRemoved({
    containerName: TEST_MAILDEV_CONTAINER_NAME
  });
}

export const maildevReset = gulp.series(maildevDown, maildevUp);

export async function mongoUser() {
  await execa('./scripts/db-create-user', { stdio: 'inherit' });
}

export async function mongoSeed() {
  await execa('./scripts/db-seed', { stdio: 'inherit' });
}

export async function mongoUp() {
  await ensureContainerRunning({
    containerName: TEST_MONGO_CONTAINER_NAME,
    runArgs: [
      '-d',
      '-p 27017:27017',
      '-e MONGODB_ROOT_USER=root',
      '-e MONGODB_ROOT_PASSWORD=rootpw',
      '-e MONGODB_REPLICA_SET_KEY=elmurs',
      '-e MONGODB_REPLICA_SET_NAME=elmurs',
      '-e MONGODB_REPLICA_SET_MODE=primary',
      '-e MONGODB_ADVERTISED_HOSTNAME=localhost',
      TEST_MONGO_IMAGE
    ].join(' '),
    afterRun: async () => {
      await mongoUser();
      await mongoSeed();
    }
  });
}

export async function mongoDown() {
  await ensureContainerRemoved({
    containerName: TEST_MONGO_CONTAINER_NAME
  });
}

export const mongoReset = gulp.series(mongoDown, mongoUp);

export async function minioUp() {
  await ensureContainerRunning({
    containerName: TEST_MINIO_CONTAINER_NAME,
    runArgs: [
      '-d',
      '-p 9000:9000',
      `-e MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}`,
      `-e MINIO_SECRET_KEY=${MINIO_SECRET_KEY}`,
      '-e MINIO_BROWSER=on',
      TEST_MINIO_IMAGE
    ].join(' '),
    afterRun: async () => {
      await execa('./scripts/s3-seed', { stdio: 'inherit' });
    }
  });
}

export async function minioDown() {
  await ensureContainerRemoved({
    containerName: TEST_MINIO_CONTAINER_NAME
  });
}

export const minioReset = gulp.series(minioDown, minioUp);

export async function minioSeed() {
  await execa('./scripts/s3-seed', { stdio: 'inherit' });
}

export function startServer(done) {
  server = spawn(
    process.execPath,
    [
      '--experimental-json-modules',
      '--experimental-loader',
      '@educandu/node-jsx-loader',
      '--enable-source-maps',
      'src/index.js'
    ],
    {
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit'
    }
  );
  server.once('exit', () => {
    server = null;
  });
  done();
}

export function restartServer(done) {
  if (server) {
    server.once('exit', () => {
      startServer(done);
    });
    server.kill();
  } else {
    startServer(done);
  }
}

export const serve = gulp.series(maildevUp, mongoUp, minioUp, build, startServer);

export const serveRestart = gulp.series(gulp.parallel(lint, testChanged, bundleJs), restartServer);

export const serveRestartRaw = gulp.series(bundleJs, restartServer);

export const ciPrepare = gulp.series(mongoUser, mongoSeed, minioSeed);

export const ci = gulp.series(clean, lint, test, build);

export function setupWatchers(done) {
  gulp.watch(['src/**/*.{js,yml,json}'], serveRestart);
  gulp.watch(['src/**/*.less'], bundleCss);
  gulp.watch(['*.js'], lint);
  gulp.watch(['scripts/**/*.js'], lint);
  gulp.watch(['scripts/db-seed.js'], mongoSeed);
  gulp.watch(['scripts/s3-seed.js'], minioSeed);
  done();
}

export function setupWatchersRaw(done) {
  gulp.watch(['src/**/*.{js,yml,json}'], serveRestartRaw);
  gulp.watch(['src/**/*.less'], bundleCss);
  gulp.watch(['scripts/db-seed.js'], mongoSeed);
  gulp.watch(['scripts/s3-seed.js'], minioSeed);
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export const startWatchRaw = gulp.series(serve, setupWatchersRaw);

export default startWatchRaw;
