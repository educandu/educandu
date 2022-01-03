import path from 'path';
import educandu from '../src/index.js';
import bundleConfig from './bundles/bundle-config.js';
import ArticleController from './article-controller.js';

educandu({
  port: process.env.TEST_APP_PORT || 3000,
  mongoConnectionString: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  skipMongoMigrations: process.env.TEST_APP_SKIP_MONGO_MIGRATIONS === true.toString(),
  includeManualMigrations: true,
  skipMongoChecks: process.env.TEST_APP_SKIP_MONGO_CHECKS === true.toString(),
  cdnEndpoint: 'http://localhost:9000',
  cdnRegion: 'eu-central-1',
  cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
  cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  cdnBucketName: 'dev-educandu-cdn',
  cdnRootUrl: 'http://localhost:9000/dev-educandu-cdn',
  sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
  sessionCookieDomain: 'localhost',
  emailSenderAddress: 'educandu-test-app@test.com',
  smtpOptions: 'smtp://127.0.0.1:8025/?ignoreTLS=true',
  bundleConfig,
  publicFolders: ['./test-app/dist', './test-app/static'].map(x => path.resolve(x)),
  resources: ['./test-app/resource-overrides.json'].map(x => path.resolve(x)),
  exportApiKey: 'fe160daddb0c44c4963f63ce08272c86',
  importSources: [
    {
      name: 'Educandu TestApp - local',
      hostName: 'localhost:3000',
      allowUnsecure: true,
      apiKey: 'fe160daddb0c44c4963f63ce08272c86'
    },
    {
      name: 'ELMU - staging',
      hostName: 'staging.elmu.online',
      apiKey: 'd5910b42afb948dcb0ae365104004b25'
    },
    {
      name: 'OMA - integration',
      hostName: 'integration.openmusic.academy',
      apiKey: '9e88fd8288ed4738813aaf764df005c4'
    }
  ],
  initialUser: {
    username: 'test',
    password: 'test',
    email: 'test@test.com'
  },
  exposeErrorDetails: true,
  taskProcessing: {
    isEnabled: false,
    idlePollIntervalInMs: 10000,
    maxAttempts: 3
  },
  additionalControllers: [ArticleController]
});
