/* eslint no-process-env: off */

import parseBool from 'parseboolean';
import Logger from '../common/logger.js';

const logger = new Logger(import.meta.url);

const env = process.env.ELMU_ENV || 'dev';

logger.info('Environment is set to %s', env);

const config = {
  env,
  port: Number(process.env.ELMU_PORT) || 3000,
  sessionDurationInMinutes: Number(process.env.ELMU_SESSION_DURATION_IN_MINUTES) || 60,
  skipDbMigrations: parseBool(process.env.ELMU_SKIP_DB_MIGRATIONS || false.toString()),
  skipDbChecks: parseBool(process.env.ELMU_SKIP_DB_CHECKS || false.toString()),
  publicFolders: []
};

switch (env) {
  case 'dev':
    config.redirectToHttps = false;
    config.redirectToNonWwwDomain = false;
    config.exposeErrorDetails = true;
    config.elmuWebConnectionString = 'mongodb://elmu:elmu@localhost:27017/dev-elmu-web?replicaSet=elmurs&authSource=admin';
    config.cdnEndpoint = 'http://localhost:9000';
    config.cdnRegion = 'eu-central-1';
    config.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
    config.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
    config.cdnBucketName = 'dev-elmu-cdn';
    config.cdnRootUrl = 'http://localhost:9000/dev-elmu-cdn';
    config.sessionSecret = 'd4340515fa834498b3ab1aba1e4d9013';
    config.smtpOptions = {
      host: 'localhost',
      port: 8025,
      ignoreTLS: true
    };
    break;

  case 'test':
    config.redirectToHttps = false;
    config.redirectToNonWwwDomain = false;
    config.exposeErrorDetails = true;
    config.elmuWebConnectionString = 'mongodb://elmu:elmu@localhost:27017/test-elmu-web?replicaSet=elmurs&authSource=admin';
    config.cdnEndpoint = 'http://localhost:9000';
    config.cdnRegion = 'eu-central-1';
    config.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
    config.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
    config.cdnBucketName = 'test-elmu-cdn';
    config.cdnRootUrl = 'http://localhost:9000/test-elmu-cdn';
    config.sessionSecret = 'd4340515fa834498b3ab1aba1e4d9013';
    config.smtpOptions = {
      host: 'localhost',
      port: 25,
      ignoreTLS: true
    };
    break;

  case 'stag':
  case 'prod':
    config.redirectToHttps = true;
    config.redirectToNonWwwDomain = true;
    config.exposeErrorDetails = false;
    config.elmuWebConnectionString = process.env.ELMU_WEB_CONNECTION_STRING;
    config.cdnEndpoint = process.env.ELMU_CDN_ENDPOINT;
    config.cdnRegion = process.env.ELMU_CDN_REGION;
    config.cdnAccessKey = process.env.ELMU_CDN_ACCESS_KEY;
    config.cdnSecretKey = process.env.ELMU_CDN_SECRET_KEY;
    config.cdnBucketName = process.env.ELMU_CDN_BUCKET_NAME;
    config.cdnRootUrl = process.env.ELMU_CDN_ROOT_URL;
    config.sessionSecret = process.env.ELMU_SESSION_SECRET;
    config.smtpOptions = JSON.parse(process.env.ELMU_SMTP_OPTIONS);
    break;
  default:
    throw new Error(`ELMU_ENV has invalid value ${env}.`);
}

class ServerConfig {
  constructor(values = {}) {
    Object.assign(this, { ...config, ...values });
  }

  exportClientConfigValues() {
    return {
      env: this.env,
      cdnRootUrl: this.cdnRootUrl
    };
  }
}

export default ServerConfig;
