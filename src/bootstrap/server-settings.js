/* eslint no-process-env: off */

const env = process.env.ELMU_ENV || 'dev';
const port = Number(process.env.ELMU_PORT) || 3000;
const sessionDurationInMinutes = 60;

const shared = {
  env,
  port,
  sessionDurationInMinutes
};

const settingsMap = {
  dev: {
    ...shared,
    elmuWebConnectionString: 'mongodb://elmu:elmu@localhost:27017/dev-elmu-web?authSource=admin',
    cdnEndpoint: 'http://localhost:9000',
    cdnRegion: 'eu-central-1',
    cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
    cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
    cdnBucketName: 'dev-elmu-cdn',
    cdnRootUrl: 'http://localhost:9000/dev-elmu-cdn',
    sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
    smtpOptions: {
      host: 'localhost',
      port: 8025,
      ignoreTLS: true
    }
  },
  test: {
    ...shared,
    elmuWebConnectionString: 'mongodb://elmu:elmu@localhost:27017/test-elmu-web?authSource=admin',
    cdnEndpoint: 'http://localhost:9000',
    cdnRegion: 'eu-central-1',
    cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
    cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
    cdnBucketName: 'test-elmu-cdn',
    cdnRootUrl: 'http://localhost:9000/test-elmu-cdn',
    sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
    smtpOptions: {
      host: 'localhost',
      port: 25,
      ignoreTLS: true
    }
  },
  stag: {
    ...shared,
    elmuWebConnectionString: process.env.ELMU_WEB_CONNECTION_STRING,
    cdnEndpoint: process.env.ELMU_CDN_ENDPOINT,
    cdnRegion: process.env.ELMU_CDN_REGION,
    cdnAccessKey: process.env.ELMU_CDN_ACCESS_KEY,
    cdnSecretKey: process.env.ELMU_CDN_SECRET_KEY,
    cdnBucketName: process.env.ELMU_CDN_BUCKET_NAME,
    cdnRootUrl: process.env.ELMU_CDN_ROOT_URL,
    sessionSecret: process.env.ELMU_SESSION_SECRET,
    smtpOptions: JSON.parse(process.env.ELMU_SMTP_OPTIONS)
  },
  prod: {
    ...shared,
    elmuWebConnectionString: process.env.ELMU_WEB_CONNECTION_STRING,
    cdnEndpoint: process.env.ELMU_CDN_ENDPOINT,
    cdnRegion: process.env.ELMU_CDN_REGION,
    cdnAccessKey: process.env.ELMU_CDN_ACCESS_KEY,
    cdnSecretKey: process.env.ELMU_CDN_SECRET_KEY,
    cdnBucketName: process.env.ELMU_CDN_BUCKET_NAME,
    cdnRootUrl: process.env.ELMU_CDN_ROOT_URL,
    sessionSecret: process.env.ELMU_SESSION_SECRET,
    smtpOptions: JSON.parse(process.env.ELMU_SMTP_OPTIONS)
  }
};

class ServerSettings {
  constructor() {
    Object.assign(this, settingsMap[env]);
  }

  exportClientSettingValues() {
    return {
      env: this.env,
      cdnRootUrl: this.cdnRootUrl
    };
  }
}

module.exports = ServerSettings;
