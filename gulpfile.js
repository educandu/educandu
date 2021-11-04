/* eslint-disable no-console, no-process-env, require-atomic-updates */
import url from 'url';
import del from 'del';
import path from 'path';
import gulp from 'gulp';
import glob from 'glob';
import yaml from 'yaml';
import execa from 'execa';
import less from 'gulp-less';
import csso from 'gulp-csso';
import gulpif from 'gulp-if';
import esbuild from 'esbuild';
import eslint from 'gulp-eslint';
import { promisify } from 'util';
import plumber from 'gulp-plumber';
import superagent from 'superagent';
import { promises as fs } from 'fs';
import Graceful from 'node-graceful';
import { spawn } from 'child_process';
import { Docker } from 'docker-cli-js';
import sourcemaps from 'gulp-sourcemaps';
import LessAutoprefix from 'less-plugin-autoprefix';

const ROOT_DIR = path.dirname(url.fileURLToPath(import.meta.url));

const TEST_MAILDEV_IMAGE = 'maildev/maildev:1.1.0';
const TEST_MAILDEV_CONTAINER_NAME = 'educandu-maildev';

const TEST_MONGO_IMAGE = 'bitnami/mongodb:4.2.17-debian-10-r23';
const TEST_MONGO_CONTAINER_NAME = 'educandu-mongo';

const TEST_MINIO_IMAGE = 'bitnami/minio:2020.12.18';
const TEST_MINIO_CONTAINER_NAME = 'educandu-minio';

const MINIO_ACCESS_KEY = 'UVDXF41PYEAX0PXD8826';
const MINIO_SECRET_KEY = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';

const optimize = (process.argv[2] || '').startsWith('ci') || process.argv.includes('--optimize');

const supportedLanguages = ['en', 'de'];

let testAppServer = null;
let testAppBuildResult = null;

Graceful.on('exit', () => {
  testAppServer?.kill();
  testAppBuildResult?.rebuild?.dispose();
});

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const kebabToCamel = str => str.replace(/-[a-z0-9]/g, c => c.toUpperCase()).replace(/-/g, '');

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
  await del(['.tmp', 'dist', 'coverage', 'reports', 'test-app/dist']);
}

export function lint() {
  return gulp.src(['*.js', 'src/**/*.js', 'scripts/**/*.js'], { base: './' })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!testAppServer, eslint.failAfterError()));
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

export async function buildJs() {
  const jsFiles = await promisify(glob)('src/**/*.js', { ignore: 'src/**/*.spec.js' });
  Promise.all(jsFiles.map(jsFile => {
    return esbuild.build({
      entryPoints: [jsFile],
      target: ['esnext'],
      format: 'esm',
      loader: { '.js': 'jsx' },
      sourcemap: true,
      sourcesContent: true,
      outfile: path.resolve('./dist', path.relative('src', jsFile))
    });
  }));
}

export function copyToDist() {
  return gulp.src(['src/**', '!src/**/*.{js,yml}'], { base: 'src' })
    .pipe(gulp.dest('dist'));
}

export const build = gulp.parallel(copyToDist, buildJs);

export function buildTestAppCss() {
  return gulp.src('test-app/main.less')
    .pipe(gulpif(!!testAppServer, plumber()))
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true, plugins: [new LessAutoprefix({ browsers: ['last 2 versions'] })] }))
    .pipe(gulpif(optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('test-app/dist'));
}

export async function buildTestAppJs() {
  if (testAppBuildResult && testAppBuildResult.rebuild) {
    await testAppBuildResult.rebuild();
  } else {
    testAppBuildResult = await esbuild.build({
      entryPoints: await promisify(glob)('./test-app/bundles/*.js'),
      target: ['esnext', 'chrome95', 'firefox93', 'safari15', 'edge95'],
      format: 'esm',
      bundle: true,
      splitting: true,
      incremental: !!testAppServer,
      minify: optimize,
      loader: { '.js': 'jsx' },
      inject: ['./test-app/polyfills.js'],
      sourcemap: true,
      sourcesContent: true,
      outdir: './test-app/dist'
    });
  }
}

export const runNewEducanduTestApp = gulp.series(
  clean,
  build,
  buildTestAppCss,
  () => execa(process.execPath, ['--experimental-json-modules', './test-app/index.js'], { stdio: 'inherit' })
);

export async function buildTranslations() {
  const filePaths = await promisify(glob)('./src/**/*.yml');

  const bundleGroups = await Promise.all(filePaths.map(async filePath => {
    const namespace = kebabToCamel(path.basename(filePath, '.yml'));
    const content = await fs.readFile(filePath, 'utf8');
    const resources = yaml.parse(content);

    if (!resources) {
      return [];
    }

    const bundlesByLanguage = {};
    const resourceKeys = Object.keys(resources);

    resourceKeys.forEach(resourceKey => {
      const languages = Object.keys(resources[resourceKey]);
      languages.forEach(language => {
        let languageBundle = bundlesByLanguage[language];
        if (!languageBundle) {
          languageBundle = {
            namespace,
            language,
            resources: {}
          };
          bundlesByLanguage[language] = languageBundle;
        }
        languageBundle.resources[resourceKey] = resources[resourceKey][language];
      });
    });

    return Object.values(bundlesByLanguage);
  }));

  const result = bundleGroups.flatMap(x => x);

  await fs.writeFile('./src/resources/resources.json', JSON.stringify(result, null, 2), 'utf8');
}

export const buildTestApp = gulp.parallel(buildTestAppCss, buildTranslations, buildTestAppJs);

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

export async function mongoUp() {
  await ensureContainerRunning({
    containerName: TEST_MONGO_CONTAINER_NAME,
    runArgs: [
      '-d',
      '-p 27017:27017',
      '-e MONGODB_ROOT_USER=root',
      '-e MONGODB_ROOT_PASSWORD=rootpw',
      '-e MONGODB_REPLICA_SET_KEY=educandurs',
      '-e MONGODB_REPLICA_SET_NAME=educandurs',
      '-e MONGODB_REPLICA_SET_MODE=primary',
      '-e MONGODB_ADVERTISED_HOSTNAME=localhost',
      TEST_MONGO_IMAGE
    ].join(' ')
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
    ].join(' ')
  });
}

export async function minioDown() {
  await ensureContainerRemoved({
    containerName: TEST_MINIO_CONTAINER_NAME
  });
}

export const minioReset = gulp.series(minioDown, minioUp);

function startTestApp({ skipMongoChecks }) {
  testAppServer = spawn(
    process.execPath,
    [
      '--experimental-json-modules',
      '--experimental-loader',
      '@educandu/node-jsx-loader',
      '--enable-source-maps',
      'test-app/index.js'
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ELMU_SKIP_DB_MIGRATIONS: true.toString(),
        ELMU_SKIP_DB_CHECKS: (!!skipMongoChecks).toString()
      },
      stdio: 'inherit'
    }
  );
  testAppServer.once('exit', () => {
    testAppServer = null;
  });
}

export function startServer(done) {
  startTestApp({ skipMongoChecks: false });
  done();
}

export function restartServer(done) {
  if (testAppServer) {
    testAppServer.once('exit', () => {
      startTestApp({ skipMongoChecks: true });
      done();
    });
    testAppServer.kill();
  } else {
    startTestApp({ skipMongoChecks: false });
    done();
  }
}

export const up = gulp.series(mongoUp, minioUp, maildevUp);

export const down = gulp.parallel(mongoDown, minioDown, maildevDown);

export const serve = gulp.series(gulp.parallel(up, build, buildTestApp), startServer);

export const ci = gulp.series(clean, lint, test, build);

export function setupWatchers(done) {
  gulp.watch(['src/**/*.{js,json}', 'test-app/**/*.{js,json}', '!test-app/dist/**'], gulp.series(buildTestAppJs, restartServer));
  gulp.watch(['src/**/*.less', 'test-app/**/*.less'], buildTestAppCss);
  gulp.watch(['src/**/*.yml'], buildTranslations);
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export default startWatch;
