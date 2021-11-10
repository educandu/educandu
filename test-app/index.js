import path from 'path';
import educandu from '../src/index.js';

educandu({
  port: 3000,
  mongoConnectionString: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  skipMongoMigrations: process.env.TEST_APP_SKIP_MONGO_MIGRATIONS === true.toString(),
  skipMongoChecks: process.env.TEST_APP_SKIP_MONGO_CHECKS === true.toString(),
  cdnEndpoint: 'http://localhost:9000',
  cdnRegion: 'eu-central-1',
  cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
  cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  cdnBucketName: 'dev-educandu-cdn',
  cdnRootUrl: 'http://localhost:9000/dev-educandu-cdn',
  sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
  sessionDurationInMinutes: 60,
  smtpOptions: {
    host: 'localhost',
    port: 8025,
    ignoreTLS: true
  },
  publicFolders: ['./test-app/dist', './test-app/static'].map(x => path.resolve(x)),
  resources: ['./test-app/resource-overrides.json'].map(x => path.resolve(x)),
  initialUser: {
    username: 'test',
    password: 'test',
    email: 'test@test.com'
  },
  exposeErrorDetails: true
});
