import path from 'path';
import educandu from '@educandu/educandu';

educandu({
  port: 3000,
  mongoConnectionString: 'mongodb://elmu:elmu@localhost:27017/dev-elmu-web?replicaSet=elmurs&authSource=admin',
  skipMongoMigrations: true,
  skipMongoChecks: false,
  cdnEndpoint: 'http://localhost:9000',
  cdnRegion: 'eu-central-1',
  cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
  cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  cdnBucketName: 'dev-elmu-cdn',
  cdnRootUrl: 'http://localhost:9000/dev-elmu-cdn',
  sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
  sessionDurationInMinutes: 60,
  smtpOptions: {
    host: 'localhost',
    port: 8025,
    ignoreTLS: true
  },
  publicFolders: ['./test-app/dist', './test-app/static'].map(x => path.resolve(x))
});
