import joi from 'joi';
import uniqueId from '../utils/unique-id.js';
import { validate } from '../domain/validation.js';

const configSchema = joi.object({
  port: joi.number().min(1),
  mongoConnectionString: joi.string().required(),
  skipMongoMigrations: joi.boolean(),
  skipMongoChecks: joi.boolean(),
  cdnEndpoint: joi.string().required(),
  cdnRegion: joi.string().required(),
  cdnAccessKey: joi.string().required(),
  cdnSecretKey: joi.string().required(),
  cdnBucketName: joi.string().required(),
  cdnRootUrl: joi.string().required(),
  sessionSecret: joi.string(),
  sessionDurationInMinutes: joi.number().min(1),
  smtpOptions: joi.any().required(),
  emailSenderAddress: joi.string().required(),
  publicFolders: joi.array().items(joi.string()),
  resources: joi.array().items(joi.string()),
  initialUser: joi.object({
    username: joi.string().required(),
    password: joi.string().required(),
    email: joi.string().required()
  }).allow(null),
  exposeErrorDetails: joi.boolean(),
  exportApiKey: joi.string(),
  importSources: joi.array().items(joi.object({
    name: joi.string().required(),
    baseUrl: joi.string().required(),
    apiKey: joi.string().required()
  }))
});

const configDefaults = {
  port: 80,
  skipMongoMigrations: false,
  skipMongoChecks: false,
  sessionSecret: uniqueId.create(),
  sessionDurationInMinutes: 60,
  publicFolders: [],
  resources: [],
  exposeErrorDetails: false,
  importSources: []
};

class ServerConfig {
  constructor(values = {}) {
    const mergedConfig = { ...configDefaults, ...values };
    validate(mergedConfig, configSchema);
    Object.assign(this, mergedConfig);
  }

  exportClientConfigValues() {
    return {
      cdnRootUrl: this.cdnRootUrl,
      importSources: this.importSources.map(({ name, baseUrl }) => ({ name, baseUrl }))
    };
  }
}

export default ServerConfig;
