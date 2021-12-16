/* eslint-disable no-console, no-process-env, require-atomic-updates, no-await-in-loop */
import url from 'url';
import del from 'del';
import path from 'path';
import gulp from 'gulp';
import yaml from 'yaml';
import { EOL } from 'os';
import axios from 'axios';
import semver from 'semver';
import less from 'gulp-less';
import csso from 'gulp-csso';
import gulpif from 'gulp-if';
import esbuild from 'esbuild';
import inquirer from 'inquirer';
import eslint from 'gulp-eslint';
import { promisify } from 'util';
import plumber from 'gulp-plumber';
import ghreleases from 'ghreleases';
import { promises as fs } from 'fs';
import Graceful from 'node-graceful';
import axiosRetry from 'axios-retry';
import { MongoClient } from 'mongodb';
import { cleanEnv, str } from 'envalid';
import sourcemaps from 'gulp-sourcemaps';
import gitSemverTags from 'git-semver-tags';
import commitsBetween from 'commits-between';
import { MongoDBStorage, Umzug } from 'umzug';
import LessAutoprefix from 'less-plugin-autoprefix';
import { cliArgs, glob, jest, kebabToCamel, MongoContainer, MinioContainer, MaildevContainer, NodeProcess, LoadBalancedNodeProcessGroup } from './dev/index.js';

const JIRA_ISSUE_PATTERN = '(EDU|OMA|ELMU)-\\d+';
const JIRA_BASE_URL = 'https://educandu.atlassian.net';

const supportedLanguages = ['en', 'de'];

let bundler = null;
let currentApp = null;

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
  return gulp.src(['*.js', 'src/**/*.js', 'scripts/**/*.js'], { base: './' })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulpif(!currentApp, eslint.failAfterError()));
}

export function fix() {
  return gulp.src(['*.js', 'src/**/*.js', 'scripts/**/*.js'], { base: './' })
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
  return gulp.src('test-app/main.less')
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
      entryPoints: ['./test-app/bundles/main.js'],
      target: ['esnext', 'chrome95', 'firefox93', 'safari13', 'edge95'],
      format: 'esm',
      bundle: true,
      splitting: true,
      incremental: !!currentApp,
      minify: cliArgs.optimize,
      loader: { '.js': 'jsx' },
      inject: ['./test-app/polyfills.js'],
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
  if (cliArgs.instances > 1) {
    currentApp = new LoadBalancedNodeProcessGroup({
      script: 'test-app/index.js',
      loadBalancerPort: 3000,
      getNodeProcessPort: index => 4000 + index,
      instanceCount: cliArgs.instances,
      getInstanceEnv: index => ({
        ...process.env,
        NODE_ENV: 'development',
        TEST_APP_PORT: (4000 + index).toString()
      })
    });
  } else {
    currentApp = new NodeProcess({
      script: 'test-app/index.js',
      env: { ...process.env, NODE_ENV: 'development' }
    });
  }

  await currentApp.start({
    TEST_APP_SKIP_MONGO_MIGRATIONS: false.toString(),
    TEST_APP_SKIP_MONGO_CHECKS: false.toString()
  });
}

export async function restartServer() {
  await currentApp.restart({
    TEST_APP_SKIP_MONGO_MIGRATIONS: true.toString(),
    TEST_APP_SKIP_MONGO_CHECKS: true.toString()
  });
}

export async function migrate() {
  const MIGRATION_FILE_NAME_PATTERN = /^educandu-\d{4}-\d{2}-\d{2}-.*(?<!\.spec)(?<!\.specs)(?<!\.test)\.js$/;

  const migrationFiles = await glob('migrations/manual/*.js');
  const migrationChoices = migrationFiles
    .filter(fileName => MIGRATION_FILE_NAME_PATTERN.test(path.basename(fileName)))
    .sort()
    .map(fileName => ({
      name: path.basename(fileName, '.js'),
      value: path.resolve(fileName)
    }));

  const { connectionString, migrationsToRun, isConfirmed } = await inquirer.prompt([
    {
      message: 'Connection string:',
      name: 'connectionString',
      type: 'input',
      filter: s => (s || '').trim(),
      validate: s => !s || !s.trim() ? 'Please provide a value' : true
    },
    {
      message: 'Migrations to run:',
      name: 'migrationsToRun',
      type: 'checkbox',
      choices: migrationChoices
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

  const mongoClient = await MongoClient.connect(connectionString, { useUnifiedTopology: true });

  const migrations = await Promise.all(migrationsToRun.map(async filePath => {
    const Migration = (await import(url.pathToFileURL(filePath).href)).default;
    const instance = new Migration(mongoClient.db(), mongoClient);
    instance.name = path.basename(filePath, '.js');
    return instance;
  }));

  const umzug = new Umzug({
    migrations,
    storage: new MongoDBStorage({ collection: mongoClient.db().collection('migrations') }),
    logger: console
  });

  const executedMigrationNames = (await umzug.executed()).map(migration => migration.name);

  migrationsToRun.forEach(migrationFullPath => {
    const executedMigrationName = executedMigrationNames.find(migrationName => migrationFullPath.includes(migrationName));
    if (executedMigrationName) {
      console.log(`Migration ${executedMigrationName} was already run, skipping it.`);
    }
  });

  umzug.on('migrated', ({ name }) => console.log(`Finished migrating ${name}`));

  try {
    await umzug.up();
  } finally {
    await mongoClient.close();
  }
}

export function verifySemverTag(done) {
  if (!semver.valid(cliArgs.tag)) {
    throw new Error(`Tag ${cliArgs.tag} is not a valid semver string`);
  }
  done();
}

export async function release() {
  const { GITHUB_REPOSITORY, GITHUB_SERVER_URL, GITHUB_ACTOR, GITHUB_TOKEN } = cleanEnv(process.env, {
    GITHUB_REPOSITORY: str(),
    GITHUB_SERVER_URL: str(),
    GITHUB_ACTOR: str(),
    GITHUB_TOKEN: str()
  });

  const [githubOrgaName, githubRepoName] = GITHUB_REPOSITORY.split('/');
  const githubBaseUrl = `${GITHUB_SERVER_URL}/${githubOrgaName}/${githubRepoName}`;

  const [currentTag, previousTag] = await promisify(gitSemverTags)();

  const commits = previousTag
    ? await commitsBetween({ from: previousTag, to: currentTag })
    : await commitsBetween();

  const commitListMarkdown = commits.map(commit => {
    const message = commit.subject
      .replace(/#\d+/g, num => `[\\${num}](${githubBaseUrl}/pull/${num.replace(/^#/, '')})`)
      .replace(new RegExp(JIRA_ISSUE_PATTERN, 'g'), num => `[${num}](${JIRA_BASE_URL}/browse/${num})`);
    const sha = `[${commit.commit.short}](${githubBaseUrl}/tree/${commit.commit.short})`;
    return `* ${message} (${sha})${EOL}`;
  }).join('');

  const releaseNotes = previousTag
    ? `${commitListMarkdown}${EOL}[View all changes](${githubBaseUrl}/compare/${previousTag}...${currentTag})${EOL}`
    : commitListMarkdown;

  console.log(`Creating Github release ${currentTag}`);
  await promisify(ghreleases.create)({ user: GITHUB_ACTOR, token: GITHUB_TOKEN }, githubOrgaName, githubRepoName, {
    // eslint-disable-next-line camelcase
    tag_name: currentTag,
    name: currentTag,
    body: releaseNotes,
    prerelease: !!semver.prerelease(currentTag)
  });

  const client = axios.create({ baseURL: JIRA_BASE_URL });
  axiosRetry(client, { retries: 3 });

  const issueKeys = [...new Set(releaseNotes.match(new RegExp(JIRA_ISSUE_PATTERN, 'g')) || [])].sort();
  for (const issueKey of issueKeys) {
    console.log(`Setting label ${currentTag} on JIRA issue ${issueKey}`);
    try {
      await client.put(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}`,
        { update: { labels: [{ add: currentTag }] } },
        { responseType: 'json', auth: { username: cliArgs.jiraUser, password: cliArgs.jiraApiKey } }
      );
    } catch (error) {
      console.log(error);
    }
  }
}

export const up = gulp.parallel(mongoUp, minioUp, maildevUp);

export const down = gulp.parallel(mongoDown, minioDown, maildevDown);

export const serve = gulp.series(gulp.parallel(up, build), buildTestApp, startServer);

export const verify = gulp.series(lint, test, build);

export function setupWatchers(done) {
  gulp.watch(['src/**/*.{js,json}', 'test-app/**/*.{js,json}', '!test-app/dist/**'], gulp.series(buildTestAppJs, restartServer));
  gulp.watch(['src/**/*.less', 'test-app/**/*.less'], gulp.series(copyToDist, buildTestAppCss));
  gulp.watch(['src/**/*.yml'], buildTranslations);
  done();
}

export const startWatch = gulp.series(serve, setupWatchers);

export default startWatch;
