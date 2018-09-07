/* eslint no-process-env: off */

const env = process.env.ELMU_ENV || 'dev';
const port = Number(process.env.ELMU_PORT) || 3000;
const sessionDurationInMinutes = 60;

const settings = {
  env,
  port,
  sessionDurationInMinutes
};

switch (env) {
  case 'dev':
    settings.elmuWebConnectionString = 'mongodb://elmu:elmu@localhost:27017/dev-elmu-web?authSource=admin';
    settings.cdnEndpoint = 'http://localhost:9000';
    settings.cdnRegion = 'eu-central-1';
    settings.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
    settings.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
    settings.cdnBucketName = 'dev-elmu-cdn';
    settings.cdnRootUrl = 'http://localhost:9000/dev-elmu-cdn';
    settings.sessionSecret = 'd4340515fa834498b3ab1aba1e4d9013';
    settings.smtpOptions = {
      host: 'localhost',
      port: 8025,
      ignoreTLS: true
    };
    break;

  case 'test':
    settings.elmuWebConnectionString = 'mongodb://elmu:elmu@localhost:27017/test-elmu-web?authSource=admin';
    settings.cdnEndpoint = 'http://localhost:9000';
    settings.cdnRegion = 'eu-central-1';
    settings.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
    settings.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
    settings.cdnBucketName = 'test-elmu-cdn';
    settings.cdnRootUrl = 'http://localhost:9000/test-elmu-cdn';
    settings.sessionSecret = 'd4340515fa834498b3ab1aba1e4d9013';
    settings.smtpOptions = {
      host: 'localhost',
      port: 25,
      ignoreTLS: true
    };
    break;

  case 'stag':
  case 'prod':
    settings.elmuWebConnectionString = process.env.ELMU_WEB_CONNECTION_STRING;
    settings.cdnEndpoint = process.env.ELMU_CDN_ENDPOINT;
    settings.cdnRegion = process.env.ELMU_CDN_REGION;
    settings.cdnAccessKey = process.env.ELMU_CDN_ACCESS_KEY;
    settings.cdnSecretKey = process.env.ELMU_CDN_SECRET_KEY;
    settings.cdnBucketName = process.env.ELMU_CDN_BUCKET_NAME;
    settings.cdnRootUrl = process.env.ELMU_CDN_ROOT_URL;
    settings.sessionSecret = process.env.ELMU_SESSION_SECRET;
    settings.smtpOptions = JSON.parse(process.env.ELMU_SMTP_OPTIONS);
    break;

  default:
    throw new Error(`ELMU_ENV has invalid value ${env}.`);
}

class ServerSettings {
  constructor() {
    Object.assign(this, settings);
  }

  exportClientSettingValues() {
    return {
      env: this.env,
      cdnRootUrl: this.cdnRootUrl
    };
  }
}

module.exports = ServerSettings;
