/* eslint-disable no-console, no-process-env, require-atomic-updates, no-await-in-loop */
import url from 'url';
import del from 'del';
import path from 'path';
import gulp from 'gulp';
import yaml from 'yaml';
import { EOL } from 'os';
import axios from 'axios';
import less from 'gulp-less';
import csso from 'gulp-csso';
import gulpif from 'gulp-if';
import esbuild from 'esbuild';
import inquirer from 'inquirer';
import eslint from 'gulp-eslint';
import plumber from 'gulp-plumber';
import { promises as fs } from 'fs';
import Graceful from 'node-graceful';
import { MongoClient } from 'mongodb';
import sourcemaps from 'gulp-sourcemaps';
import { MongoDBStorage, Umzug } from 'umzug';
import LessAutoprefix from 'less-plugin-autoprefix';
import {
  cliArgs,
  createGithubRelease,
  createLabelInJiraIssues,
  createReleaseNotesFromCurrentTag,
  ensureIsValidSemverTag,
  glob,
  getEnvAsString,
  jest,
  kebabToCamel,
  MongoContainer,
  MinioContainer,
  MaildevContainer,
  TunnelProxyContainer,
  NodeProcess,
  LoadBalancedNodeProcessGroup
} from './dev/index.js';

const supportedLanguages = ['en', 'de'];

let bundler = null;
let currentApp = null;
let currentCdnProxy = null;

const mongoContainer = new MongoContainer({
  port: 27017,
  rootUser: 'root',
  rootPassword: 'rootpw',
  replicaSetName: 'educandurs'
});

const minioContainer = new MinioContainer({
  port: 9000,
  accessKey: 'UVDXF41PYEAX0PXD8826',
  secretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  initialBuckets: ['dev-educandu-cdn']
});

const maildevContainer = new MaildevContainer({
  smtpPort: 8025,
  frontendPort: 8000
});

Graceful.on('exit', async () => {
  bundler?.rebuild?.dispose();
  await currentApp?.waitForExit();
  await currentCdnProxy?.waitForExit();
});

const downloadCountryList = async lang => {
  const res = await axios.get(
    `https://raw.githubusercontent.com/umpirsky/country-list/master/data/${encodeURIComponent(lang)}/country.json`,
    { responseType: 'json' }
  );
  await fs.writeFile(`./src/data/country-names/${lang}.json`, JSON.stringify(res.data, null, 2), 'utf8');
};

export async function clean() {
  await del(['.tmp', 'dist', 'coverage', 'reports', 'test-app/dist']);
}

export function lint() {
  return gulp.src(['*.js', 'src/**/*.js', 'test-app/src/**/*.js', 'scripts/**/*.js'], { base: './' })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!currentApp, eslint.failAfterError()));
}

export function fix() {
  return gulp.src(['*.js', 'src/**/*.js', 'test-app/src/**/*.js', 'scripts/**/*.js'], { base: './' })
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(gulpif(file => file.eslint?.fixed, gulp.dest('./')))
    .pipe(eslint.failAfterError());
}

export function test() {
  return jest.coverage();
}

export function testChanged() {
  return jest.changed();
}

export function testWatch() {
  return jest.watch();
}

export async function buildJs() {
  const jsFiles = await glob('src/**/*.js', { ignore: 'src/**/*.spec.js' });
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
  return gulp.src('test-app/src/main.less')
    .pipe(gulpif(!!currentApp, plumber()))
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true, plugins: [new LessAutoprefix({ browsers: ['last 2 versions', 'Safari >= 13'] })] }))
    .pipe(gulpif(cliArgs.optimize, csso()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('test-app/dist'));
}

export async function buildTestAppJs() {
  if (bundler && bundler.rebuild) {
    await bundler.rebuild();
  } else {
    bundler = await esbuild.build({
      entryPoints: ['./test-app/src/client/main.js'],
      target: ['esnext', 'chrome95', 'firefox93', 'safari13', 'edge95'],
      format: 'esm',
      bundle: true,
      splitting: true,
      incremental: !!currentApp,
      minify: cliArgs.optimize,
      loader: { '.js': 'jsx' },
      inject: ['./test-app/src/polyfills.js'],
      metafile: cliArgs.optimize,
      sourcemap: true,
      sourcesContent: true,
      outdir: './test-app/dist'
    });

    if (bundler.metafile) {
      const bundles = Object.entries(bundler.metafile.outputs)
        .map(([name, { bytes }]) => ({ name, bytes }))
        .filter(x => x.name.endsWith('.js'));

      const formatBytes = bytes => `${(bytes / 1000).toFixed(2)} kB`;
      bundles.forEach(({ name, bytes }) => console.log(`${name}: ${formatBytes(bytes)}`));
      console.log(`TOTAL: ${formatBytes(bundles.reduce((sum, { bytes }) => sum + bytes, 0))}`);

      await fs.writeFile('./test-app/dist/meta.json', JSON.stringify(bundler.metafile, null, 2), 'utf8');
    }
  }
}

export async function buildTranslations() {
  const filePaths = await glob('./src/**/*.yml');

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
  await maildevContainer.ensureIsRunning();
}

export async function maildevDown() {
  await maildevContainer.ensureIsRemoved();
}

export const maildevReset = gulp.series(maildevDown, maildevUp);

export async function mongoUp() {
  await mongoContainer.ensureIsRunning();
}

export async function mongoDown() {
  await mongoContainer.ensureIsRemoved();
}

export const mongoReset = gulp.series(mongoDown, mongoUp);

export async function minioUp() {
  await minioContainer.ensureIsRunning();
}

export async function minioDown() {
  await minioContainer.ensureIsRemoved();
}

export const minioReset = gulp.series(minioDown, minioUp);

export async function startServer() {
  const { instances, tunnel } = cliArgs;

  const tunnelToken = tunnel ? getEnvAsString('TUNNEL_TOKEN') : null;
  const tunnelWebsiteDomain = tunnel ? getEnvAsString('TUNNEL_WEBSITE_DOMAIN') : null;
  const tunnelWebsiteCdnDomain = tunnel ? getEnvAsString('TUNNEL_WEBSITE_CDN_DOMAIN') : null;

  if (tunnel) {
    console.log('Opening tunnel connections');
    const websiteTunnel = new TunnelProxyContainer({
      name: 'website-tunnel',
      tunnelToken,
      tunnelDomain: tunnelWebsiteDomain,
      localPort: 3000
    });

    const websiteCdnTunnel = new TunnelProxyContainer({
      name: 'website-cdn-tunnel',
      tunnelToken,
      tunnelDomain: tunnelWebsiteCdnDomain,
      localPort: 10000
    });

    await Promise.all([
      websiteTunnel.ensureIsRunning(),
      websiteCdnTunnel.ensureIsRunning()
    ]);

    Graceful.on('exit', async () => {
      console.log('Closing tunnel connections');
      await Promise.all([
        websiteTunnel.ensureIsRemoved(),
        websiteCdnTunnel.ensureIsRemoved()
      ]);
    });
  }

  const env = {
    TEST_APP_CDN_ROOT_URL: tunnel ? `https://${tunnelWebsiteCdnDomain}` : 'http://localhost:10000',
    TEST_APP_SESSION_COOKIE_DOMAIN: tunnel ? tunnelWebsiteDomain : null,
    TEST_APP_SESSION_COOKIE_NAME: 'LOCAL_SESSION_ID'
  };

  currentCdnProxy = new NodeProcess({
    script: 'node_modules/@educandu/rooms-auth-lambda/src/dev-server/run.js',
    env: {
      ...process.env,
      PORT: 10000,
      WEBSITE_BASE_URL: tunnel ? `https://${tunnelWebsiteDomain}` : 'http://localhost:3000',
      CDN_BASE_URL: 'http://localhost:9000/dev-educandu-cdn',
      SESSION_COOKIE_NAME: 'LOCAL_SESSION_ID'
    }
  });

  if (instances > 1) {
    currentApp = new LoadBalancedNodeProcessGroup({
      script: 'test-app/src/index.js',
      jsx: true,
      loadBalancerPort: 3000,
      getNodeProcessPort: index => 4000 + index,
      instanceCount: cliArgs.instances,
      getInstanceEnv: index => ({
        ...env,
        ...process.env,
        NODE_ENV: 'development',
        TEST_APP_PORT: (4000 + index).toString()
      })
    });
  } else {
    currentApp = new NodeProcess({
      script: 'test-app/src/index.js',
      jsx: true,
      env: {
        ...env,
        ...process.env,
        NODE_ENV: 'development',
        TEST_APP_PORT: (3000).toString()
      }
    });
  }

  await Promise.all([
    currentCdnProxy.start(),
    currentApp.start()
  ]);
}

export async function restartServer() {
  await currentApp.restart({
    TEST_APP_SKIP_MAINTENANCE: true.toString()
  });
}

export async function migrate() {
  let mongoClient;

  try {
    const MIGRATION_FILE_NAME_PATTERN = /^educandu-\d{4}-\d{2}-\d{2}-.*(?<!\.spec)(?<!\.specs)(?<!\.test)\.js$/;
    const migrationFiles = await glob('migrations/*.js');

    const migrationInfos = migrationFiles
      .filter(fileName => MIGRATION_FILE_NAME_PATTERN.test(path.basename(fileName)))
      .sort()
      .map(fileName => ({
        name: path.basename(fileName, '.js'),
        filePath: path.resolve(fileName)
      }));

    const { connectionString } = await inquirer.prompt([
      {
        message: 'Connection string:',
        name: 'connectionString',
        type: 'input',
        filter: s => (s || '').trim(),
        validate: s => !s || !s.trim() ? 'Please provide a value' : true
      }
    ]);

    mongoClient = await MongoClient.connect(connectionString, { useUnifiedTopology: true });

    await Promise.all(migrationInfos.map(async info => {
      const Migration = (await import(url.pathToFileURL(info.filePath).href)).default;
      const instance = new Migration(mongoClient.db(), mongoClient);
      instance.name = info.name;
      info.migration = instance;
    }));

    const umzug = new Umzug({
      migrations: migrationInfos.map(info => info.migration),
      storage: new MongoDBStorage({ collection: mongoClient.db().collection('migrations') }),
      logger: console
    });

    umzug.on('migrated', ({ name }) => console.log(`Finished migrating ${name}`));

    const executedMigrationNames = (await umzug.executed()).map(migration => migration.name);

    migrationInfos.forEach(info => {
      info.isExecuted = executedMigrationNames.includes(info.name);
    });

    const migrationChoices = migrationInfos.map(info => ({
      name: `${info.isExecuted ? '🔄' : '  '} ${info.name}`,
      value: info.name
    }));

    const { migrationsToRun, isConfirmed } = await inquirer.prompt([
      {
        message: 'Migrations to run:',
        name: 'migrationsToRun',
        type: 'checkbox',
        choices: migrationChoices,
        pageSize: migrationChoices.length + 1,
        loop: false
      },
      {
        when: currentAnswers => !!currentAnswers.migrationsToRun.length,
        message: currentAnswers => [
          'You have selected the follwing migrations:',
          ...currentAnswers.migrationsToRun,
          'Do you want to run them now?'
        ].join(EOL),
        name: 'isConfirmed',
        type: 'confirm'
      }
    ]);

    if (!isConfirmed) {
      console.log('No migration will be run, quitting');
      return;
    }

    console.log(`Running ${migrationsToRun.length} ${migrationsToRun.length === 1 ? 'migration' : 'migrations'}`);
    await umzug.up({ migrations: migrationsToRun, rerun: 'ALLOW' });
  } finally {
    await mongoClient?.close();
  }
}

export function verifySemverTag(done) {
  ensureIsValidSemverTag(cliArgs.tag);
  done();
}

export async function release() {
  const { currentTag, releaseNotes, jiraIssueKeys } = await createReleaseNotesFromCurrentTag({
    jiraBaseUrl: cliArgs.jiraBaseUrl,
    jiraProjectKeys: cliArgs.jiraProjectKeys.split(',')
  });

  await createGithubRelease({
    githubToken: cliArgs.githubToken,
    currentTag,
    releaseNotes,
    files: []
  });

  await createLabelInJiraIssues({
    jiraBaseUrl: cliArgs.jiraBaseUrl,
    jiraUser: cliArgs.jiraUser,
    jiraApiKey: cliArgs.jiraApiKey,
    jiraIssueKeys,
    label: currentTag
  });
}

export const up = gulp.parallel(mongoUp, minioUp, maildevUp);

export const down = gulp.parallel(mongoDown, minioDown, maildevDown);

export const serve = gulp.series(gulp.parallel(up, build), buildTestApp, startServer);

export const verify = gulp.series(lint, test, build);

export function setupWatchers(done) {
  gulp.watch(['src/**/*.{js,json}', 'test-app/src/**/*.{js,json}'], gulp.series(buildTestAppJs, restartServer));
  gulp.watch(['src/**/*.less', 'test-app/src/**/*.less'], gulp.series(copyToDist, buildTestAppCss));
  gulp.watch(['src/**/*.yml'], buildTranslations);
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export default startWatch;
