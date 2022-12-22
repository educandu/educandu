import url from 'node:url';
import path from 'node:path';
import parseBool from 'parseboolean';
import educandu from '../../src/index.js';
import bundleConfig from './bundles/bundle-config.js';
import TestsController from '../../src/server/tests-controller.js';

const processEnv = process.env;

const thisDir = path.dirname(url.fileURLToPath(import.meta.url));

const plugins = [
  'markdown',
  'markdown-with-image',
  'image',
  'catalog',
  'annotation',
  'audio',
  'video',
  'table',
  'pdf-viewer',
  'table-of-contents',
  'matching-cards',
  'diagram-net',
  'iframe',
  'abc-notation',
  'music-xml-viewer',
  'quick-tester',
  'ear-training',
  'audio-waveform',
  'media-slideshow',
  'interactive-media',
  'multitrack-media',
  'media-analysis'
];

const config = {
  appName: 'educandu',
  port: Number(processEnv.TEST_APP_PORT) || 3000,
  mongoConnectionString: processEnv.TEST_APP_WEB_CONNECTION_STRING,
  skipMaintenance: parseBool(processEnv.TEST_APP_SKIP_MAINTENANCE || false.toString()),
  cdnEndpoint: processEnv.TEST_APP_CDN_ENDPOINT,
  cdnRegion: processEnv.TEST_APP_CDN_REGION,
  cdnAccessKey: processEnv.TEST_APP_CDN_ACCESS_KEY,
  cdnSecretKey: processEnv.TEST_APP_CDN_SECRET_KEY,
  cdnBucketName: processEnv.TEST_APP_CDN_BUCKET_NAME,
  cdnRootUrl: processEnv.TEST_APP_CDN_ROOT_URL,
  bundleConfig,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  resources: ['./test-app/src/local-resources.json', './test-app/src/resource-overrides.json'].map(x => path.resolve(x)),
  themeFile: path.resolve('./test-app/src/theme.less'),
  additionalControllers: [TestsController],
  sessionSecret: processEnv.TEST_APP_SESSION_SECRET,
  sessionCookieDomain: processEnv.TEST_APP_SESSION_COOKIE_DOMAIN,
  sessionCookieName: processEnv.TEST_APP_SESSION_COOKIE_NAME,
  sessionDurationInMinutes: Number(processEnv.TEST_APP_SESSION_DURATION_IN_MINUTES) || 60,
  consentCookieNamePrefix: processEnv.TEST_APP_CONSENT_COOKIE_NAME_PREFIX,
  uploadLiabilityCookieName: processEnv.TEST_APP_UPLOAD_LIABILITY_COOKIE_NAME,
  xFrameOptions: processEnv.TEST_APP_X_FRAME_OPTIONS,
  smtpOptions: processEnv.TEST_APP_SMTP_OPTIONS,
  emailSenderAddress: processEnv.TEST_APP_EMAIL_SENDER_ADDRESS,
  adminEmailAddress: processEnv.TEST_APP_ADMIN_EMAIL_ADDRESS,
  initialUser: processEnv.TEST_APP_INITIAL_USER ? JSON.parse(processEnv.TEST_APP_INITIAL_USER) : null,
  basicAuthUsers: JSON.parse(processEnv.TEST_APP_BASIC_AUTH_USERS || '{}'),
  plugins,
  exposeErrorDetails: parseBool(processEnv.TEST_APP_EXPOSE_ERROR_DETAILS || false.toString()),
  taskProcessing: {
    isEnabled: true,
    idlePollIntervalInMs: 10000,
    maxAttempts: 3
  },
  ambConfig: {
    apiKey: processEnv.TEST_APP_AMB_API_KEY,
    image: './images/educandu-logo-blue.png',
    publisher: [
      {
        type: 'Organization',
        name: 'Educandu'
      }
    ],
    about: [
      {
        id: 'https://w3id.org/kim/hochschulfaechersystematik/n78'
      }
    ]
  }
};

educandu(config);
