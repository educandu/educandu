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
        key: 'samltest',
        displayName: 'SAMLTEST.ID',
        entryPoint: 'https://samltest.id/idp/profile/SAML2/Redirect/SSO',
        cert: `
MIIDEjCCAfqgAwIBAgIVAMECQ1tjghafm5OxWDh9hwZfxthWMA0GCSqGSIb3DQEB
CwUAMBYxFDASBgNVBAMMC3NhbWx0ZXN0LmlkMB4XDTE4MDgyNDIxMTQwOVoXDTM4
MDgyNDIxMTQwOVowFjEUMBIGA1UEAwwLc2FtbHRlc3QuaWQwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC0Z4QX1NFKs71ufbQwoQoW7qkNAJRIANGA4iM0
ThYghul3pC+FwrGv37aTxWXfA1UG9njKbbDreiDAZKngCgyjxj0uJ4lArgkr4AOE
jj5zXA81uGHARfUBctvQcsZpBIxDOvUUImAl+3NqLgMGF2fktxMG7kX3GEVNc1kl
bN3dfYsaw5dUrw25DheL9np7G/+28GwHPvLb4aptOiONbCaVvh9UMHEA9F7c0zfF
/cL5fOpdVa54wTI0u12CsFKt78h6lEGG5jUs/qX9clZncJM7EFkN3imPPy+0HC8n
spXiH/MZW8o2cqWRkrw3MzBZW3Ojk5nQj40V6NUbjb7kfejzAgMBAAGjVzBVMB0G
A1UdDgQWBBQT6Y9J3Tw/hOGc8PNV7JEE4k2ZNTA0BgNVHREELTArggtzYW1sdGVz
dC5pZIYcaHR0cHM6Ly9zYW1sdGVzdC5pZC9zYW1sL2lkcDANBgkqhkiG9w0BAQsF
AAOCAQEASk3guKfTkVhEaIVvxEPNR2w3vWt3fwmwJCccW98XXLWgNbu3YaMb2RSn
7Th4p3h+mfyk2don6au7Uyzc1Jd39RNv80TG5iQoxfCgphy1FYmmdaSfO8wvDtHT
TNiLArAxOYtzfYbzb5QrNNH/gQEN8RJaEf/g/1GTw9x/103dSMK0RXtl+fRs2nbl
D1JJKSQ3AdhxK/weP3aUPtLxVVJ9wMOQOfcy02l+hHMb6uAjsPOpOVKqi3M8XmcU
ZOpx4swtgGdeoSpeRyrtMvRwdcciNBp9UZome44qZAYH1iqrpmmjsfI9pJItsgWu
3kXPjhSfj1AJGR1l9JGvJrHki1iHTA==
        `.trim(),
        logoUrl: 'https://samltest.id/wp-content/uploads/2018/08/Logo-2-73x73.png',
        expiryTimeoutInDays: 6 * 30
      },
      {
        key: 'panda',
        displayName: 'The Panda University',
        entryPoint: 'https://en.wikipedia.org/wiki/Giant_panda',
        cert: 'nonsense',
        logoUrl: '/images/panda-logo.svg',
        expiryTimeoutInDays: 4 * 30
      },
      {
        key: 'handshake',
        displayName: 'The Massachusetts International Institute of Handshakes - this is a reeeeeeeally long name',
        entryPoint: 'https://en.wikipedia.org/wiki/Handshake',
        cert: 'nonsense',
        logoUrl: '/images/handshake-logo.svg',
        expiryTimeoutInDays: 2 * 30
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
  resources: ['./test-app/src/local-resources.json', './test-app/src/resource-overrides.json'].map(x => path.resolve(x)),
  themeFile: path.resolve('./test-app/src/theme.less'),
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
