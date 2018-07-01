/* eslint no-process-env: off */

const clientSettings = require('./client-settings');

const env = process.env.ELMU_ENV || 'dev';

const commonSettings = {
  env: env,
  port: 3000
};

const overrides = {
  dev: {
    elmuWebConnectionString: 'mongodb://elmu:elmu@localhost:27017/dev-elmu-web?authSource=admin',
    cdnEndpoint: 'http://localhost:9000',
    cdnRegion: 'eu-central-1',
    cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
    cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
    cdnBucketName: 'dev-elmu-cdn'
  },
  test: {
    elmuWebConnectionString: 'mongodb://elmu:elmu@localhost:27017/test-elmu-web?authSource=admin',
    cdnEndpoint: 'http://localhost:9000',
    cdnRegion: 'eu-central-1',
    cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
    cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
    cdnBucketName: 'test-elmu-cdn'
  },
  stag: {
    elmuWebConnectionString: process.env.ELMU_WEB_CONNECTION_STRING,
    cdnEndpoint: process.env.ELMU_CDN_ENDPOINT,
    cdnRegion: process.env.ELMU_CDN_REGION,
    cdnAccessKey: process.env.ELMU_CDN_ACCESS_KEY,
    cdnSecretKey: process.env.ELMU_CDN_SECRET_KEY,
    cdnBucketName: process.env.ELMU_CDN_BUCKET_NAME
  },
  prod: {
    elmuWebConnectionString: process.env.ELMU_WEB_CONNECTION_STRING,
    cdnEndpoint: process.env.ELMU_CDN_ENDPOINT,
    cdnRegion: process.env.ELMU_CDN_REGION,
    cdnAccessKey: process.env.ELMU_CDN_ACCESS_KEY,
    cdnSecretKey: process.env.ELMU_CDN_SECRET_KEY,
    cdnBucketName: process.env.ELMU_CDN_BUCKET_NAME
  }
};

module.exports = {
  ...clientSettings,
  ...commonSettings,
  ...overrides[env]
};
