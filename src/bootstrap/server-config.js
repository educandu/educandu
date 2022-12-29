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
  trustProxy: joi.alternatives(joi.boolean(), joi.number().integer().min(0)).default(false),
  mongoConnectionString: joi.string().required(),
  skipMaintenance: joi.boolean().default(false),
  cdnEndpoint: joi.string().required(),
  cdnRegion: joi.string().required(),
  cdnAccessKey: joi.string().required(),
  cdnSecretKey: joi.string().required(),
  cdnBucketName: joi.string().required(),
  cdnRootUrl: joi.string().required(),
  bundleConfig: joi.object({
    getPageTemplateComponent: joi.func().required().allow(null),
    getHomePageTemplateComponent: joi.func().required().allow(null),
    getSiteLogoComponent: joi.func().required().allow(null)
  }).required(),
  publicFolders: joi.array().items(joi.string()).default([]),
  resources: joi.array().items(joi.string()).default([]),
  themeFile: joi.string().default(''),
  additionalControllers: joi.array().items(joi.function().class()).default([]),
  additionalHeadHtml: joi.string().default(''),
  sessionSecret: joi.string().default(uniqueId.create()),
  sessionCookieDomain: joi.string(),
  sessionCookieName: joi.string().required(),
  sessionCookieSecure: joi.boolean().default(false),
  sessionDurationInMinutes: joi.number().min(1).default(60),
  consentCookieNamePrefix: joi.string().required(),
  uploadLiabilityCookieName: joi.string().required(),
  xFrameOptions: joi.string().valid('DENY', 'SAMEORIGIN').allow(null).default(null),
  smtpOptions: joi.any().required(),
  emailSenderAddress: joi.string().required(),
  adminEmailAddress: joi.string().default(null),
  initialUser: joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
    displayName: joi.string().required()
  }).allow(null),
  basicAuthUsers: joi.object().default({}),
  plugins: joi.array().items(joi.string().required()).default(['markdown', 'image']),
  disabledFeatures: joi.array().items(joi.string().valid(...Object.values(FEATURE_TOGGLES))).default([]),
  exposeErrorDetails: joi.boolean().default(false),
  taskProcessing: joi.object({
    isEnabled: joi.boolean().default(defaultTaskProcessing.isEnabled),
    idlePollIntervalInMs: joi.number().min(1).default(defaultTaskProcessing.idlePollIntervalInMs),
    maxAttempts: joi.number().min(1).default(defaultTaskProcessing.maxAttempts)
  }).default(defaultTaskProcessing),
  ambConfig: joi.object({
    apiKey: joi.string().required(),
    image: joi.string(),
    publisher: joi.array().items(joi.object({
      type: joi.string().valid('Organization', 'Person').required(),
      name: joi.string().required()
    })),
    about: joi.array().items(joi.object({
      id: joi.string().required()
    }))
  }).default({}),
  externalAccountProviders: joi.array().items(joi.object({
    key: joi.string().required(),
    displayName: joi.string().required(),
    loginUrl: joi.string().required(),
    logoUrl: joi.string().allow(null).default(null),
    expiryTimeoutInDays: joi.number().integer().min(1).default(6 * 30)
  })).default([])
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
      adminEmailAddress: this.adminEmailAddress,
      consentCookieNamePrefix: this.consentCookieNamePrefix,
      uploadLiabilityCookieName: this.uploadLiabilityCookieName,
      plugins: this.plugins,
      externalAccountProviders: this.externalAccountProviders.map(p => ({
        key: p.key,
        displayName: p.displayName,
        loginUrl: p.loginUrl,
        logoUrl: p.logoUrl
      }))
    };
  }
}

export default ServerConfig;
