import del from 'del';
import gulp from 'gulp';
import Graceful from 'node-graceful';
import {
  buildTranslationsJson,
  cliArgs,
  createGithubRelease,
  createLabelInJiraIssues,
  createReleaseNotesFromCurrentTag,
  downloadJson,
  ensureIsValidSemverTag,
  esbuild,
  eslint,
  getEnvAsString,
  vitest,
  less,
  LoadBalancedNodeProcessGroup,
  MaildevContainer,
  MinioContainer,
  MongoContainer,
  NodeProcess,
  runInteractiveMigrations,
  TunnelProxyContainer
} from '@educandu/dev-tools';

const supportedLanguages = ['en', 'de'];

let bundler = null;
let currentApp = null;
let currentCdnProxy = null;

const testAppEnv = {
  TEST_APP_WEB_CONNECTION_STRING: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  TEST_APP_CDN_ENDPOINT: 'http://localhost:9000',
  TEST_APP_CDN_REGION: 'eu-central-1',
  TEST_APP_CDN_ACCESS_KEY: 'UVDXF41PYEAX0PXD8826',
  TEST_APP_CDN_SECRET_KEY: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  TEST_APP_CDN_BUCKET_NAME: 'dev-educandu-cdn',
  TEST_APP_CDN_ROOT_URL: 'http://localhost:9000/dev-educandu-cdn',
  TEST_APP_SESSION_SECRET: 'd4340515fa834498b3ab1aba1e4d9013',
  TEST_APP_SESSION_COOKIE_DOMAIN: 'localhost',
  TEST_APP_SESSION_COOKIE_NAME: 'SESSION_ID_TEST_APP_LOCAL',
  TEST_APP_EMAIL_SENDER_ADDRESS: 'educandu-test-app@test.com',
  TEST_APP_SMTP_OPTIONS: 'smtp://127.0.0.1:8025/?ignoreTLS=true',
  TEST_APP_INITIAL_USER: JSON.stringify({ username: 'test', password: 'test', email: 'test@test.com' }),
  TEST_APP_EXPOSE_ERROR_DETAILS: true.toString(),
  TEST_APP_ARE_ROOMS_ENABLED: true.toString(),
  TEST_APP_IMPORT_SOURCES: JSON.stringify([{ name: 'ELMU - Integration', hostName: 'integration.elmu.online', apiKey: '03a026b939154f41bb1dabf578a33e11' }]),
  TEST_APP_SKIP_MAINTENANCE: false.toString(),
  TEST_APP_AMB_API_KEY: '4985nvcz56v1'
};

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

export async function clean() {
  await del(['.test', 'dist', 'coverage', 'test-app/dist']);
}

export async function lint() {
  await eslint.lint(['*.js', 'src/**/*.js', 'migrations/**/*.js', 'test-app/src/**/*.js'], { failOnError: !currentApp });
}

export async function fix() {
  await eslint.fix(['*.js', 'src/**/*.js', 'migrations/**/*.js', 'test-app/src/**/*.js']);
}

export function test() {
  return vitest.coverage();
}

export function testWatch() {
  return vitest.watch();
}

export async function buildJs() {
  await esbuild.transpileDir({ inputDir: 'src', outputDir: 'dist', ignore: '**/*.spec.js' });
}

export function copyToDist() {
  return gulp.src(['src/**', '!src/**/*.{js,yml}'], { base: 'src' }).pipe(gulp.dest('dist'));
}

export const build = gulp.parallel(copyToDist, buildJs);

export async function buildTestAppCss() {
  await less.compile({
    inputFile: 'test-app/src/main.less',
    outputFile: 'test-app/dist/main.css',
    optimize: !!cliArgs.optimize
  });
}

export async function buildTestAppJs() {
  if (bundler?.rebuild) {
    await bundler.rebuild();
  } else {
    // eslint-disable-next-line require-atomic-updates
    bundler = await esbuild.bundle({
      entryPoints: ['./test-app/src/bundles/main.js'],
      outdir: './test-app/dist',
      minify: !!cliArgs.optimize,
      incremental: !!currentApp,
      inject: ['./test-app/src/polyfills.js'],
      metaFilePath: './test-app/dist/meta.json'
    });
  }
}

export async function buildTranslations() {
  await buildTranslationsJson({ pattern: './src/**/*.yml', outputFile: './src/resources/resources.json' });
}

export const buildTestApp = gulp.parallel(buildTestAppCss, buildTranslations, buildTestAppJs);

export async function countriesUpdate() {
  await Promise.all(supportedLanguages.map(lang => downloadJson(
    `https://raw.githubusercontent.com/umpirsky/country-list/master/data/${encodeURIComponent(lang)}/country.json`,
    `./src/data/country-names/${lang}.json`
  )));
}

export async function maildevUp() {
  await maildevContainer.ensureIsRunning();
}

export async function maildevDown() {
  await maildevContainer.ensureIsRemoved();
}

export async function mongoUp() {
  await mongoContainer.ensureIsRunning();
}

export async function mongoDown() {
  await mongoContainer.ensureIsRemoved();
}

export async function minioUp() {
  await minioContainer.ensureIsRunning();
}

export async function minioDown() {
  await minioContainer.ensureIsRemoved();
}

export async function startServer() {
  const { instances, tunnel } = cliArgs;

  const tunnelToken = tunnel ? getEnvAsString('TUNNEL_TOKEN') : null;
  const tunnelWebsiteDomain = tunnel ? getEnvAsString('TUNNEL_WEBSITE_DOMAIN') : null;
  const tunnelWebsiteCdnDomain = tunnel ? getEnvAsString('TUNNEL_WEBSITE_CDN_DOMAIN') : null;

  if (tunnel) {
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log('Closing tunnel connections');
      await Promise.all([
        websiteTunnel.ensureIsRemoved(),
        websiteCdnTunnel.ensureIsRemoved()
      ]);
    });
  }

  const finalTestAppEnv = {
    NODE_ENV: 'development',
    ...testAppEnv,
    TEST_APP_CDN_ROOT_URL: tunnel ? `https://${tunnelWebsiteCdnDomain}` : 'http://localhost:10000',
    TEST_APP_SESSION_COOKIE_DOMAIN: tunnel ? tunnelWebsiteDomain : testAppEnv.TEST_APP_SESSION_COOKIE_DOMAIN
  };

  currentCdnProxy = new NodeProcess({
    script: 'node_modules/@educandu/rooms-auth-lambda/src/dev-server/run.js',
    env: {
      NODE_ENV: 'development',
      PORT: 10000,
      WEBSITE_BASE_URL: tunnel ? `https://${tunnelWebsiteDomain}` : 'http://localhost:3000',
      CDN_BASE_URL: 'http://localhost:9000/dev-educandu-cdn',
      SESSION_COOKIE_NAME: testAppEnv.TEST_APP_SESSION_COOKIE_NAME
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
        ...finalTestAppEnv,
        TEST_APP_PORT: (4000 + index).toString()
      })
    });
  } else {
    currentApp = new NodeProcess({
      script: 'test-app/src/index.js',
      jsx: true,
      env: {
        ...finalTestAppEnv,
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
  await runInteractiveMigrations({
    migrationsDirectory: 'migrations',
    migrationFileNamePattern: /^educandu-\d{4}-\d{2}-\d{2}-.*(?<!\.spec)(?<!\.specs)(?<!\.test)\.js$/
  });
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
