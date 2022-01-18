import path from 'path';
import educandu from '../src/index.js';
import bundleConfig from './bundles/bundle-config.js';
import ArticleController from './article-controller.js';

educandu({
  port: process.env.TEST_APP_PORT || 3000,
  mongoConnectionString: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  skipMaintenance: process.env.TEST_APP_SKIP_MAINTENANCE === true.toString(),
  cdnEndpoint: 'http://localhost:9000',
  cdnRegion: 'eu-central-1',
  cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
  cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  cdnBucketName: 'dev-educandu-cdn',
  cdnRootUrl: process.env.TEST_APP_CDN_ROOT_URL || 'http://localhost:10000',
  sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
  sessionCookieDomain: process.env.TEST_APP_SESSION_COOKIE_DOMAIN || 'localhost',
  sessionCookieName: process.env.TEST_APP_SESSION_COOKIE_NAME || 'LOCAL_SESSION_ID',
  emailSenderAddress: 'educandu-test-app@test.com',
  smtpOptions: 'smtp://127.0.0.1:8025/?ignoreTLS=true',
  bundleConfig,
  publicFolders: ['./test-app/dist', './test-app/static'].map(x => path.resolve(x)),
  resources: ['./test-app/resource-overrides.json'].map(x => path.resolve(x)),
  exportApiKey: 'fe160daddb0c44c4963f63ce08272c86',
  importSources: [
    {
      name: 'ELMU - integration',
      hostName: 'integration.elmu.online',
      apiKey: '03a026b939154f41bb1dabf578a33e11'
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
  additionalControllers: [ArticleController],
  areRoomsEnabled: true
});
