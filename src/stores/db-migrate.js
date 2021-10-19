import Umzug from 'umzug';
import path from 'path';

export async function migrate(mongoClient) {
  const db = mongoClient.db();
  const umzug = new Umzug({
    storage: 'mongodb',
    storageOptions: {
      collection: db.collection('migrations')
    },
    migrations: {
      path: path.join(__dirname, 'migrations'),
      pattern: /^\d{4}-\d{2}-\d{2}-.*\.js$/,
      customResolver: filePath => {
        const Migration = require(filePath).default;
        return new Migration(db, mongoClient);
      }
    }
  });
  await umzug.up();
}
