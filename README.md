# educandu

[![codecov](https://codecov.io/gh/educandu/educandu/branch/main/graph/badge.svg?token=SM7ANNBT3A)](https://codecov.io/gh/educandu/educandu)

The educandu framework

## Perequisites

 * Node 16 or higher
 * Docker
 * gulp installed globally (for conveninence): npm i -g gulp

 ## Configuration options

 | Option | Description | Type | Required |
 | --- | --- | --- | --- |
 | port | Port on which the project is run | `number`, mininum 1 | no, defaults to 80 |
 | mongoConnectionString | The URI for the project's MongoDB | `string` | yes |
 | skipMaintenance | Whether or not to run MongoDB migrations and checks on startup | `boolean` | no, defaults to `false` |
 | cdnEndpoint | The URL of the AWS-hosted CDN | `string` | yes |
 | cdnRegion | The region of the AWS-hosted CDN | `string` | yes |
 | cdnAccessKey | The access key of the AWS-hosted CDN | `string` | yes |
 | cdnSecretKey | The secret key of the AWS-hosted CDN | `string` | yes |
 | cdnBucketName | The name of the AWS S3 bucket storing the CDN data | `string` | yes |
 | cdnRootUrl | The root url of the CDN | `string` | yes |
 | sessionSecret | The unique ID of the user session | `string` | no, defaults to a generated unique id |
 | sessionDurationInMinutes | The validity of the user session in minutes | `number`, minumum 1 | no, defaults to 60 |
 | sessionCookieDomain | The domain attribute to be set on the session cookie | `string` | no, defaults to the request's host header domain |
 | sessionCookieName | The name to be used for the session cookie | `string` | yes |
 | smtpOptions | The SMTP setup for sending emails to users upon registration or password reset | anything | yes |
 | emailSenderAddress | The email address from which emails are sent | `string` | yes |
 | bundleConfig | The same object that is also used to hydrate the app on the client side | `{ getPageTemplateComponent, getHomePageTemplateComponent, getSiteLogoComponent }` | yes, accepts `null` for either property and it will default to the internal setup
 | publicFolders | The project-specific public folders that need to be accesible on the project domain | `array` of string | no |
 | resources | URLs to additional resource bundles, e.g. extra translations  | `array` of string  | no |
 | initialUser | The first user account, with admin role | `{ username, password, email }` or `null` | no |
 | exposeErrorDetails | Whether or not to expose details of thrown errors (e.g. stack trace) | `boolean` | no, defaults to `false` |
 | exportApiKey | The API key used for authorizing incoming requests for fetching data to be imported into another system | `string` | no |
 | importSources | The system from which data can be imported | `[{ name, hostName, allowUnsecure, apiKey }]` | no, if not specified then `allowUnsecure` defaults to `false` |
 | disabledFeatures | A list of names of disabled features | `string[]` | no |
 | taskProcessing | Task processing setup | `{ isEnabled, idlePollIntervalInMs, maxAttempts }` | no, defaults to `{ isEnabled: false, idlePollIntervalInMs: 5000, maxAttempts: 3 }` |
 | additionalControllers | Custom controllers | arrayOfControllers: [] | no, defaults to [] |
 | consentCookieNamePrefix | Prefix for the consent cookie name | `string` | no |
 | areRoomsEnabled | Enables rooms | `boolean` | no, defaults to `false` |

## How to use

~~~
$ yarn add @educandu/educandu
~~~

Use it in code as follows:

~~~
import educandu from '@educandu/educandu';

educandu({
  port: 3000,
  mongoConnectionString: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  skipMaintenance: process.env.TEST_APP_SKIP_MAINTENANCE === true.toString(),
  cdnEndpoint: 'http://localhost:9000',
  cdnRegion: 'eu-central-1',
  cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
  cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
  cdnBucketName: 'dev-educandu-cdn',
  cdnRootUrl: 'http://localhost:9000/dev-educandu-cdn',
  sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
  sessionDurationInMinutes: 60,
  emailSenderAddress: 'educandu-test-app@test.com',
  smtpOptions: 'smtp://localhost:8025/?ignoreTLS=true',
  publicFolders: ['./test-app/dist', './test-app/static'].map(x => path.resolve(x)),
  resources: ['./test-app/resource-overrides.json'].map(x => path.resolve(x)),
  initialUser: {
    username: 'test',
    password: 'test',
    email: 'test@test.com'
  },
  exposeErrorDetails: true,
  exportApiKey: 'GSD54GDFgDGesdfs4'
  importSources: [{
    name: 'otherSystem',
    hostName: 'othersystem.com',
    apiKey: 'FSERFSF56Ggsdfg6FGED'
  }],
  additionalControllers: [],
  consentCookieNamePrefixPrefix: 'APP_CONSENT_COOKIE_NAME'
});
~~~

This should run the entire application and provide you with an admin user as defined on the initialUser setting.

## How to override the styles

In order to override the styles provided by educandu you need to import the main.less of the educandu project and override the less variables provided. An example override implementation is provided by the test-app in the 
main.less file. We will keep this file updated so any user will know what can be overriden. Alternatively you can go 
to the global-variables.less in educandu and consult the list there.

## How to run and develop locally

~~~
$ yarn
$ gulp                 # run the test application
$ gulp --instances 3   # run 3 instances behind a load balancer
$ gulp --tunnel        # run using the tunnel proxy; TUNNEL_TOKEN secret is needed in the env variables beforehand
~~~

This will build and start up the TestApp (in watch mode), which is set up to use educandu.

By default the application requires that the following ports are available to be taken:
  * 3000: the application itself (or the load balancer)
  * 400x: the individual application instances, in case of load balancing
  * 8000: maildev UI, can be used for debugging emails that would be sent to the users (head to http://localhost:8000 when the application is running)
  * 8025: maildev smpt server port
  * 9000: minio docker image (local CDN used for testing)
  * 21017: mongodb docker image port

The ports can be changed in the gulp file and must be changed in the gulpfile.js and need to be reflected in the test-app/index.js.

The gulpfile has a number of useful tasks which can be run with "gulp taskName", here are some more widely used:
 * test: runs all tests (with coverage)
 * testWatch: runs tests in watch mode
 * testChanged: runs tests that were affected by the current modifications
 * lint: runs lint
 * up: starts all the containers (if not already running)
 * down: stops all the containers and deletes them


## How add additional controllers
  In order to extend the educandu functionality you can add your custom controllers. These should be classes that expose one or more of the following methods:
   * registerApi: regiters API endpoints
   * registerPages: registers additional pages
   * registerMiddleware: regiters some middleware
   * registerErrorHandler: regiters error handlers
  
  
An example implementation is given in the test app for registering a redirect from an "/articles" page to the standard "doc/:docKey/*" page of educandu. You can find the additional controller
in the article-controller.js file.

## License

Educandu is released under the MIT License. See the bundled LICENSE file for details.

---

## OER learning platform for music

Funded by 'Stiftung Innovation in der Hochschullehre'

<img src="https://stiftung-hochschullehre.de/wp-content/uploads/2020/07/logo_stiftung_hochschullehre_screenshot.jpg)" alt="Logo der Stiftung Innovation in der Hochschullehre" width="200"/>

A Project of the 'Hochschule für Musik und Theater München' (University for Music and Performing Arts)

<img src="https://upload.wikimedia.org/wikipedia/commons/d/d8/Logo_Hochschule_f%C3%BCr_Musik_und_Theater_M%C3%BCnchen_.png" alt="Logo der Hochschule für Musik und Theater München" width="200"/>

Project owner: Bernd Redmann\
Project management: Ulrich Kaiser
