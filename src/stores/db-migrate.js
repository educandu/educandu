import Umzug from 'umzug';
import path from 'path';
import { MongoClient } from 'mongodb';
import Logger from '../common/logger';

const logger = new Logger(__filename);

export async function migrate(connectionString) {
  const mongoClient = await MongoClient.connect(connectionString, { useUnifiedTopology: true });

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
        logger.info('migrating path', filePath);
        return new Migration(db, mongoClient);
      }
    }
  });
  try {
    const result = await umzug.up();
    logger.info(result);
  } finally {
    await mongoClient.close();
  }
}
