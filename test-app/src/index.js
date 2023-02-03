import url from 'node:url';
import path from 'node:path';
import parseBool from 'parseboolean';
import educandu from '../../src/index.js';
import bundleConfig from './bundles/bundle-config.js';
import TestsController from '../../src/server/tests-controller.js';

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

const samlAuth = parseBool(process.env.TEST_APP_ENABLE_SAML_AUTH)
  ? {
    decryption: JSON.parse(process.env.TEST_APP_SAML_AUTH_DECRYPTION),
    identityProviders: [
      {
        key: 'hfmutm',
        displayName: 'Hochschule für Musik und Theater München',
        logoUrl: 'https://hmtm.de/wp-content/uploads/logos/hmtm_logo.svg',
        expiryTimeoutInDays: 6 * 30,
        metadata: {
          url: 'https://www.aai.dfn.de/metadata/dfn-aai-idp-metadata.xml',
          entityId: 'https://sso.hmtm.de/idp/shibboleth'
        }
      },
      {
        key: 'hfmn',
        displayName: 'Hochschule für Musik Nürnberg',
        logoUrl: 'https://www.hfm-nuernberg.de/fileadmin/templates/images/layout/logo-hfmn.png',
        expiryTimeoutInDays: 6 * 30,
        metadata: {
          url: 'https://www.aai.dfn.de/metadata/dfn-aai-idp-metadata.xml',
          entityId: 'https://sso.hfm-nuernberg.de/idp/shibboleth'
        }
      },
      {
        key: 'samltest',
        displayName: 'SAMLTEST.ID',
        logoUrl: 'https://samltest.id/wp-content/uploads/2018/08/Logo-2-73x73.png',
        expiryTimeoutInDays: 6 * 30,
        metadata: {
          url: 'https://samltest.id/saml/idp',
          entityId: 'https://samltest.id/saml/idp'
        }
      }
    ]
  }
  : null;

const config = {
  appName: 'educandu',
  port: Number(process.env.TEST_APP_PORT) || 3000,
  trustProxy: true,
  mongoConnectionString: process.env.TEST_APP_WEB_CONNECTION_STRING,
  skipMaintenance: parseBool(process.env.TEST_APP_SKIP_MAINTENANCE || false.toString()),
  cdnEndpoint: process.env.TEST_APP_CDN_ENDPOINT,
  cdnRegion: process.env.TEST_APP_CDN_REGION,
  cdnAccessKey: process.env.TEST_APP_CDN_ACCESS_KEY,
  cdnSecretKey: process.env.TEST_APP_CDN_SECRET_KEY,
  cdnBucketName: process.env.TEST_APP_CDN_BUCKET_NAME,
  cdnRootUrl: process.env.TEST_APP_CDN_ROOT_URL,
  bundleConfig,
  publicFolders: ['../dist', '../static'].map(x => path.resolve(thisDir, x)),
  resources: ['./resources.json'].map(x => path.resolve(thisDir, x)),
  themeFile: path.resolve(thisDir, './theme.less'),
  allowedLicenses: ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'CC-BY-NC-SA-4.0', 'CC-BY-ND-4.0', 'CC-BY-NC-ND-4.0', 'MIT'],
  additionalControllers: [TestsController],
  sessionSecret: process.env.TEST_APP_SESSION_SECRET,
  sessionCookieDomain: process.env.TEST_APP_SESSION_COOKIE_DOMAIN,
  sessionCookieName: process.env.TEST_APP_SESSION_COOKIE_NAME,
  sessionDurationInMinutes: Number(process.env.TEST_APP_SESSION_DURATION_IN_MINUTES) || 60,
  consentCookieNamePrefix: process.env.TEST_APP_CONSENT_COOKIE_NAME_PREFIX,
  uploadLiabilityCookieName: process.env.TEST_APP_UPLOAD_LIABILITY_COOKIE_NAME,
  xFrameOptions: process.env.TEST_APP_X_FRAME_OPTIONS,
  xRoomsAuthSecret: process.env.TEST_APP_X_ROOMS_AUTH_SECRET,
  smtpOptions: process.env.TEST_APP_SMTP_OPTIONS,
  emailSenderAddress: process.env.TEST_APP_EMAIL_SENDER_ADDRESS,
  adminEmailAddress: process.env.TEST_APP_ADMIN_EMAIL_ADDRESS,
  initialUser: process.env.TEST_APP_INITIAL_USER ? JSON.parse(process.env.TEST_APP_INITIAL_USER) : null,
  basicAuthUsers: JSON.parse(process.env.TEST_APP_BASIC_AUTH_USERS || '{}'),
  plugins,
  exposeErrorDetails: parseBool(process.env.TEST_APP_EXPOSE_ERROR_DETAILS || false.toString()),
  taskProcessing: {
    isEnabled: true,
    idlePollIntervalInMs: 10000,
    maxAttempts: 3
  },
  ambConfig: {
    apiKey: process.env.TEST_APP_AMB_API_KEY,
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
  },
  samlAuth
};

educandu(config);
