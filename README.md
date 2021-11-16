# educandu

[![codecov](https://codecov.io/gh/educandu/educandu/branch/main/graph/badge.svg?token=SM7ANNBT3A)](https://codecov.io/gh/educandu/educandu)

The educandu framework

## Perequisites

 * Node 16 or higher
 * Docker
 * gulp installed globally (for conveninence): npm i -g gulp

## How to use

~~~
$ yarn add @educandu/educandu
~~~

Use it in code as follows:

~~~
import educandu from '@educandu/educandu';

educandu({
  port: 3000, //on which to run the application
  mongoConnectionString: 'mongodb://root:rootpw@localhost:27017/dev-educandu-db?replicaSet=educandurs&authSource=admin',
  skipMongoMigrations: process.env.TEST_APP_SKIP_MONGO_MIGRATIONS === true.toString(),
  skipMongoChecks: process.env.TEST_APP_SKIP_MONGO_CHECKS === true.toString(),
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
  exposeErrorDetails: true //set to false in order to hide error details such as stack trace on productive systems
});
~~~

This should run both the entire application and provide you with an admin user as defined on the initialUser setting. In order to create other admins please consult the users page in the application. Here, admins can promote other users to the admin role.

## How to run and develop locally

~~~
$ yarn
$ gulp
~~~

This will build and start up the TestApp (in watch mode), which is set up to use educandu.

By default the application requires that the following ports are available to be taken:
  * 3000: the application itself
  * 8000: maildev server, can be used for debugging emails that would be sent to the users (head to http://localhost:8000 when the application is running)
  * 8025: smpt server port
  * 9000: minio docker image (local CDN used for testing)
  * 21017: mongodb docker image port

The ports can be changed in the gulp file and must be changed in the gulpfile.js and need to be reflected in the test-app/index.js.

The gulpfile has a number of useful tasks which can be run with "gulp taskName", here are some more widely used:
 * test: runs all tests
 * testChanged: runs tests that were affected by the current modifications
 * lint: runs lint
 * down: stops all the containers and deletes them


## License

Educandu is released under the MIT License. See the bundled LICENSE file for details.
