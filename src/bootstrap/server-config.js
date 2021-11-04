/* eslint no-process-env: off */
import parseBool from 'parseboolean';
import Logger from '../common/logger.js';

const logger = new Logger(import.meta.url);

const env = process.env.EDUCANDU_ENV || 'dev';

logger.info('Environment is set to %s', env);

const config = {
  env,
  port: Number(process.env.EDUCANDU_PORT) || 3000,
  skipMongoMigrations: parseBool(process.env.EDUCANDU_SKIP_MONGO_MIGRATIONS || false.toString()),
  skipMongoChecks: parseBool(process.env.EDUCANDU_SKIP_MONGO_CHECKS || false.toString()),
  publicFolders: [],
  initialUser: null
};

switch (env) {
  case 'dev':
    config.redirectToHttps = false;
    config.redirectToNonWwwDomain = false;
    config.exposeErrorDetails = true;
    config.mongoConnectionString = 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin';
    config.cdnEndpoint = 'http://localhost:9000';
    config.cdnRegion = 'eu-central-1';
    config.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
    config.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
    config.cdnBucketName = 'dev-educandu-cdn';
    config.cdnRootUrl = 'http://localhost:9000/dev-educandu-cdn';
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
    config.mongoConnectionString = 'mongodb://root:rootpw@localhost:27017/test-educandu-db?replicaSet=educandurs&authSource=admin';
    config.cdnEndpoint = 'http://localhost:9000';
    config.cdnRegion = 'eu-central-1';
    config.cdnAccessKey = 'UVDXF41PYEAX0PXD8826';
    config.cdnSecretKey = 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx';
    config.cdnBucketName = 'test-educandu-cdn';
    config.cdnRootUrl = 'http://localhost:9000/test-educandu-cdn';
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
    break;
  default:
    throw new Error(`EDUCANDU_ENV has invalid value ${env}.`);
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
