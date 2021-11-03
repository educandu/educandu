# educandu

The educandu framework

## How to use:

~~~
$ yarn add @educandu/educandu
~~~

Use it in code like this:

~~~
import educandu from '@educandu/educandu';

educandu({
  port: Number(process.env.PORT) || 3000,
  mongoConnectionString: 'mongodb://user:pwd@localhost:27017/my-db?replicaSet=myrs&authSource=admin',
  skipMongoMigrations: process.env.SKIP_MONGO_MIGRATIONS === 'true',
  skipMongoChecks: process.env.SKIP_MONGO_CHECKS === 'true',
  cdnEndpoint: 'http://localhost:9000',
  cdnRegion: 'eu-central-1',
  cdnAccessKey: 'KSHJFHKJHFSGDJVAJHD',
  cdnSecretKey: 'ZUUUHFJKJKHDJKHJKKJhdkjsdhku',
  cdnBucketName: 'my-cdn-bucket',
  cdnRootUrl: 'http://localhost:9000/my-cdn-url',
  sessionSecret: '49zcn238zt43zt7c8234nt8843t8',
  sessionDurationInMinutes: Number(process.env.SESSION_DURATION_IN_MINUTES) || 60,
  smtpOptions: {
    host: 'localhost',
    port: 8025,
    ignoreTLS: true
  }
});
~~~

## License

Educandu is released under the MIT License. See the bundled LICENSE file for details.
