import joi from 'joi';
import uniqueId from '../utils/unique-id.js';
import { FEATURE_TOGGLES } from '../domain/constants.js';
import { defaultValidationOptions, validate } from '../domain/validation.js';

const defaultTaskProcessing = {
  isEnabled: false,
  idlePollIntervalInMs: 5000,
  maxAttempts: 3
};

const configSchema = joi.object({
  appName: joi.string().required(),
  port: joi.number().min(1).default(80),
  mongoConnectionString: joi.string().required(),
  skipMaintenance: joi.boolean().default(false),
  cdnEndpoint: joi.string().required(),
  cdnRegion: joi.string().required(),
  cdnAccessKey: joi.string().required(),
  cdnSecretKey: joi.string().required(),
  cdnBucketName: joi.string().required(),
  cdnRootUrl: joi.string().required(),
  sessionSecret: joi.string().default(uniqueId.create()),
  sessionCookieDomain: joi.string(),
  sessionCookieName: joi.string().required(),
  sessionDurationInMinutes: joi.number().min(1).default(60),
  smtpOptions: joi.any().required(),
  emailSenderAddress: joi.string().required(),
  bundleConfig: joi.object({
    getPageTemplateComponent: joi.func().required().allow(null),
    getHomePageTemplateComponent: joi.func().required().allow(null),
    getSiteLogoComponent: joi.func().required().allow(null)
  }).required(),
  publicFolders: joi.array().items(joi.string()).default([]),
  resources: joi.array().items(joi.string()).default([]),
  initialUser: joi.object({
    username: joi.string().required(),
    password: joi.string().required(),
    email: joi.string().required()
  }).allow(null),
  exposeErrorDetails: joi.boolean().default(false),
  exportApiKey: joi.string(),
  importSources: joi.array().items(joi.object({
    name: joi.string().required(),
    hostName: joi.string().required(),
    allowUnsecure: joi.boolean().default(false),
    apiKey: joi.string().required()
  })).default([]),
  disabledFeatures: joi.array().items(joi.string().valid(...Object.values(FEATURE_TOGGLES))).default([]),
  taskProcessing: joi.object({
    isEnabled: joi.boolean().default(defaultTaskProcessing.isEnabled),
    idlePollIntervalInMs: joi.number().min(1).default(defaultTaskProcessing.idlePollIntervalInMs),
    maxAttempts: joi.number().min(1).default(defaultTaskProcessing.maxAttempts)
  }).default(defaultTaskProcessing),
  additionalControllers: joi.array().items(joi.function().class()).default([]),
  consentCookieNamePrefix: joi.string().required(),
  uploadLiabilityCookieName: joi.string().required(),
  areRoomsEnabled: joi.bool().default(false),
  additionalHeadHtml: joi.string().default(''),
  plugins: joi.array().items(joi.string().required()).default(['markdown', 'image']),
  basicAuthUsers: joi.object().default({}),
  ambConfig: joi.object({
    apiKey: joi.string().required(),
    image: joi.string(),
    publisher: joi.object({
      type: joi.string().valid('Organization', 'Person').required(),
      name: joi.string().required()
    })
  }).default({})
});

class ServerConfig {
  constructor(values = {}) {
    const validationOptions = {
      ...defaultValidationOptions,
      convert: true,
      noDefaults: false
    };

    const config = validate(values, configSchema, validationOptions);

    Object.assign(this, config);
  }

  exportClientConfigValues() {
    return {
      appName: this.appName,
      cdnRootUrl: this.cdnRootUrl,
      disabledFeatures: this.disabledFeatures,
      importSources: this.importSources.map(({ name, hostName, allowUnsecure }) => ({ name, hostName, allowUnsecure })),
      consentCookieNamePrefix: this.consentCookieNamePrefix,
      uploadLiabilityCookieName: this.uploadLiabilityCookieName,
      areRoomsEnabled: this.areRoomsEnabled,
      plugins: this.plugins
    };
  }
}

export default ServerConfig;
