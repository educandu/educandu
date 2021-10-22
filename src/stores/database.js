import { MongoClient } from 'mongodb';
import Umzug from 'umzug';
import path from 'path';
import Logger from '../common/logger';
import usersSpec from './collection-specs/users';
import settingsSpec from './collection-specs/settings';
import sessionsSpec from './collection-specs/sessions';
import documentsSpec from './collection-specs/documents';
import documentLocksSpec from './collection-specs/document-locks';
import documentOrdersSpec from './collection-specs/document-orders';
import documentRevisionsSpec from './collection-specs/document-revisions';
import passwordResetRequestsSpec from './collection-specs/password-reset-requests';

const MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT = 86;

const logger = new Logger(__filename);

const collectionSpecs = [
  usersSpec,
  settingsSpec,
  sessionsSpec,
  documentsSpec,
  documentLocksSpec,
  documentOrdersSpec,
  documentRevisionsSpec,
  passwordResetRequestsSpec
];

class Database {
  constructor(connectionString) {
    this._connectionString = connectionString;
  }

  async connect() {
    logger.info('Trying to connect to MongoDB');
    this._mongoClient = await MongoClient.connect(this._connectionString, { useUnifiedTopology: true });
    logger.info('Successfully connected to MongoDB');
    this._db = this._mongoClient.db();
  }

  async createCollections() {
    const promises = collectionSpecs.map(collectionSpec => this.createCollection(collectionSpec));
    await Promise.all(promises);
  }

  async createCollection(collectionSpec) {
    const collectionName = collectionSpec.name;
    const indexes = collectionSpec.indexes || [];

    const existingCollections = await this._db.listCollections().toArray();
    const collectionExists = existingCollections.map(col => col.name).includes(collectionName);

    if (collectionExists) {
      logger.info('Collection %s already exists. Skipping creation.', collectionName);
    } else {
      logger.info('Creating collection %s on MongoDB.', collectionName);
      await this._db.createCollection(collectionName);
    }

    const collection = this._db.collection(collectionName);

    if (indexes.length) {
      try {
        logger.info('Creating %s indexes on MongoDB collection %s', indexes.length, collectionName);
        await collection.createIndexes(indexes);
      } catch (error) {
        if (error.code === MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT) {
          logger.info('Indexes on MongoDB collection %s seem to have changes. Dropping old ones.', collectionName);
          await collection.dropIndexes();
          logger.info('Creating %s indexes on MongoDB collection %s', indexes.length, collectionName);
          await collection.createIndexes(indexes);
        } else {
          throw error;
        }
      }
    }

    this[collectionName] = collection;
  }

  async dispose() {
    logger.info('Closing MongoDB connection');
    await this._mongoClient.close();
  }

  async runMigrationScripts(mongoClient) {
    const db = mongoClient.db();
    const umzug = new Umzug({
      storage: 'mongodb',
      storageOptions: {
        collection: db.collection('migrations')
      },
      migrations: {
        path: path.resolve(__dirname, '../../migrations'),
        pattern: /^\d{4}-\d{2}-\d{2}-.*\.js$/,
        customResolver: filePath => {
          // eslint-disable-next-line global-require
          const Migration = require(filePath).default;
          return new Migration(db, mongoClient);
        }
      }
    });

    umzug.addListener('migrated', name => logger.info(`Finished migrating ${name}`));

    await umzug.up();
  }

  static async create({ connectionString, runDbMigration }) {

    const database = new Database(connectionString);
    await database.connect();

    if (runDbMigration) {
      try {
        logger.info('Starting migrations');
        await database.runMigrationScripts(database._mongoClient);
        logger.info('Finished migrations successfully');
      } catch (error) {
        logger.error(error);
        throw error;
      }
    }

    await database.createCollections();
    return database;
  }
}

export default Database;
