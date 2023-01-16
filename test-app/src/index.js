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
        entryPoint: 'https://sso.hmtm.de/idp/profile/SAML2/Redirect/SSO',
        cert: `
MIIIfTCCB2WgAwIBAgIMJj0zvi8rzkVg2EWEMA0GCSqGSIb3DQEBCwUAMIGNMQsw
CQYDVQQGEwJERTFFMEMGA1UECgw8VmVyZWluIHp1ciBGb2VyZGVydW5nIGVpbmVz
IERldXRzY2hlbiBGb3JzY2h1bmdzbmV0emVzIGUuIFYuMRAwDgYDVQQLDAdERk4t
UEtJMSUwIwYDVQQDDBxERk4tVmVyZWluIEdsb2JhbCBJc3N1aW5nIENBMB4XDTIy
MDMwMTA1NTkxM1oXDTIzMDQwMTA1NTkxM1oweDELMAkGA1UEBhMCREUxDzANBgNV
BAgMBkJheWVybjERMA8GA1UEBwwITXVlbmNoZW4xLzAtBgNVBAoMJkJheWVyaXNj
aGUgQWthZGVtaWUgZGVyIFdpc3NlbnNjaGFmdGVuMRQwEgYDVQQDDAtzc28uaG10
bS5kZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOKg7DxSN4NHiDVr
ZDEVwU2zqQ4yRwqkt78IToYkiXyg4OVsIaVx60bpW+/RAqERNM/nxqol0bk6H5RI
G5NEz0IPXRuKwfkA/zT3RoyPW5tTXa/DQCir6r7nMIlZUyVZw/2tfwJXd8ad/UFK
LzMiLs4YfsdZjjyJLDo5W0l7GjFnQSZ+noaWuTBR/azE4LYzAzGSvirpyjXAgZoH
MZz3i1J2vhJU50SaKw2z6eb/R2gqtv/4311no0qrqNE3MP+4ud8rFar1hc8/GuzY
+gFvhME2WeoprhaBScY2jwHFPLkjgCG3QgmJIjtsTn93uSzhPOBdCrTSwS8Zmjk9
cLEle+0CAwEAAaOCBO8wggTrMFcGA1UdIARQME4wCAYGZ4EMAQICMA0GCysGAQQB
ga0hgiweMA8GDSsGAQQBga0hgiwBAQQwEAYOKwYBBAGBrSGCLAEBBAowEAYOKwYB
BAGBrSGCLAIBBAowCQYDVR0TBAIwADAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYw
FAYIKwYBBQUHAwIGCCsGAQUFBwMBMB0GA1UdDgQWBBRBcHDD8t6PHbc2st5PM6K2
UJKUrjAfBgNVHSMEGDAWgBRrOpiL+fJTidrgrbIyHgkf6Ko7dDCBrgYDVR0RBIGm
MIGjghFpcGExLXRlc3QuaG10bS5kZYIMaXBhMS5obXRtLmRlghFpcGEyLXRlc3Qu
aG10bS5kZYIMaXBhMi5obXRtLmRlghBzc28tdGVzdC5obXRtLmRlghFzc28tdGVz
dDEuaG10bS5kZYIRc3NvLXRlc3QyLmhtdG0uZGWCC3Nzby5obXRtLmRlggxzc28x
LmhtdG0uZGWCDHNzbzIuaG10bS5kZTCBjQYDVR0fBIGFMIGCMD+gPaA7hjlodHRw
Oi8vY2RwMS5wY2EuZGZuLmRlL2Rmbi1jYS1nbG9iYWwtZzIvcHViL2NybC9jYWNy
bC5jcmwwP6A9oDuGOWh0dHA6Ly9jZHAyLnBjYS5kZm4uZGUvZGZuLWNhLWdsb2Jh
bC1nMi9wdWIvY3JsL2NhY3JsLmNybDCB2wYIKwYBBQUHAQEEgc4wgcswMwYIKwYB
BQUHMAGGJ2h0dHA6Ly9vY3NwLnBjYS5kZm4uZGUvT0NTUC1TZXJ2ZXIvT0NTUDBJ
BggrBgEFBQcwAoY9aHR0cDovL2NkcDEucGNhLmRmbi5kZS9kZm4tY2EtZ2xvYmFs
LWcyL3B1Yi9jYWNlcnQvY2FjZXJ0LmNydDBJBggrBgEFBQcwAoY9aHR0cDovL2Nk
cDIucGNhLmRmbi5kZS9kZm4tY2EtZ2xvYmFsLWcyL3B1Yi9jYWNlcnQvY2FjZXJ0
LmNydDCCAfUGCisGAQQB1nkCBAIEggHlBIIB4QHfAHYArfe++nz/EMiLnT2cHj4Y
arRnKV3PsQwkyoWGNOvcgooAAAF/RA+8qgAABAMARzBFAiEAvTwnTF05u0Tg3gfc
j6/B65fv5USiqnY/yerziIpeLMoCIEm1m17NbkN094qi7wIrHOjOVcji7ReRNZEp
Cj4pNdAdAHUA6D7Q2j71BjUy51covIlryQPTy9ERa+zraeF3fW0GvW4AAAF/RA++
jwAABAMARjBEAiAcAuhrneQzXU24VRvLm3y3mItS3HlZ/yLHQCWrbn8WWwIgOZDz
Zt7vYf1zb5JhnghUie9Wtv4FosheTM8mUdH7kHYAdgBvU3asMfAxGdiZAKRRFf93
FRwR2QLBACkGjbIImjfZEwAAAX9ED7nHAAAEAwBHMEUCIFSuCaEJPv41AkLNlmxK
XVCVdfcgzQeIy4jhFEpZeJeIAiEAx83eHUyzbaHDnLCsVD2GGM31r2dDGM2OB7Oo
fjhpJe0AdgBVgdTCFpA2AUrqC5tXPFPwwOQ4eHAlCBcvo6odBxPTDAAAAX9ED7q9
AAAEAwBHMEUCIFOqXSCQIXUvcJNRxGuYBf8b363/cbesU20stCbyZfEQAiEAgeJs
LnScoNp9qRoyYmkDf+Z3/4L+oeTCFbledxj6x1kwDQYJKoZIhvcNAQELBQADggEB
AJt8iHYPWQVC+04aAddG1HMggWpKPvZiDcCrqaiwUQpGQWydl+qtCVG+M6Ie4TK7
Y4LvJHFjwXmehUfrs7cX1+WZWzQOlCWpI719Yk10Q8PqpXg3BVpW0Iq45UG6jLqX
jrewNb8gvm3wOsJndLKsUEp0zPoglpYBepK1b5jR75dDaSaszikCtV2qQp0sluJA
DBGo6/bgX2OC7/Jr+D7D7Z/oJGHFa1MUALLw3u2UHNE2NXpgCe8qGFOogk54Oc80
rlebyuFykeYO9Mb4WLwpED7Nyy86j1f8LvOUWwOA50SkHf4wyhKWFktPxTDTS7uH
01C3GW3f+o6UhwKp5L443bg=
        `.trim(),
        logoUrl: 'https://hmtm.de/wp-content/uploads/logos/hmtm_logo.svg',
        expiryTimeoutInDays: 6 * 30
      },
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
