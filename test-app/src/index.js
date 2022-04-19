import url from 'url';
import path from 'path';
import parseBool from 'parseboolean';
import educandu from '../../src/index.js';
import bundleConfig from './bundles/bundle-config.js';

// eslint-disable-next-line no-process-env
const processEnv = process.env;

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));

const plugins = [
  'markdown',
  'quick-tester',
  'audio',
  'video',
  'image',
  'pdf-viewer',
  'iframe',
  'anavis',
  'image-tiles',
  'diagram-net',
  'annotation',
  'abc-notation',
  'ear-training',
  'interval-trainer',
  'interactive-media',
  'table'
];

const config = {
  appName: 'educandu',
  bundleConfig,
  port: Number(processEnv.TEST_APP_PORT) || 3000,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  resources: ['./test-app/src/local-resources.json', './test-app/src/resource-overrides.json'].map(x => path.resolve(x)),
  sessionDurationInMinutes: Number(processEnv.TEST_APP_SESSION_DURATION_IN_MINUTES) || 60,
  skipMaintenance: parseBool(processEnv.TEST_APP_SKIP_MAINTENANCE || false.toString()),
  mongoConnectionString: processEnv.TEST_APP_WEB_CONNECTION_STRING,
  cdnEndpoint: processEnv.TEST_APP_CDN_ENDPOINT,
  cdnRegion: processEnv.TEST_APP_CDN_REGION,
  cdnAccessKey: processEnv.TEST_APP_CDN_ACCESS_KEY,
  cdnSecretKey: processEnv.TEST_APP_CDN_SECRET_KEY,
  cdnBucketName: processEnv.TEST_APP_CDN_BUCKET_NAME,
  cdnRootUrl: processEnv.TEST_APP_CDN_ROOT_URL,
  sessionSecret: processEnv.TEST_APP_SESSION_SECRET,
  sessionCookieDomain: processEnv.TEST_APP_SESSION_COOKIE_DOMAIN,
  sessionCookieName: processEnv.TEST_APP_SESSION_COOKIE_NAME,
  emailSenderAddress: processEnv.TEST_APP_EMAIL_SENDER_ADDRESS,
  smtpOptions: processEnv.TEST_APP_SMTP_OPTIONS,
  initialUser: processEnv.TEST_APP_INITIAL_USER ? JSON.parse(processEnv.TEST_APP_INITIAL_USER) : null,
  exposeErrorDetails: parseBool(processEnv.TEST_APP_EXPOSE_ERROR_DETAILS || false.toString()),
  exportApiKey: processEnv.TEST_APP_EXPORT_API_KEY,
  importSources: JSON.parse(processEnv.TEST_APP_IMPORT_SOURCES || '[]'),
  taskProcessing: {
    isEnabled: true,
    idlePollIntervalInMs: 10000,
    maxAttempts: 3
  },
  additionalControllers: [],
  consentCookieNamePrefix: 'CONSENT_TEST_APP',
  areRoomsEnabled: parseBool(processEnv.TEST_APP_ARE_ROOMS_ENABLED || false.toString()),
  isAdminTestsTabEnabled: parseBool(processEnv.TEST_APP_IS_ADMIN_TESTS_TAB_ENABLED || false.toString()),
  plugins
};

educandu(config);
