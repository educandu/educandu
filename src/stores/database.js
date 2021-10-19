import Graceful from 'node-graceful';
import { MongoClient } from 'mongodb';
import Logger from '../common/logger';
import menusSpec from './collection-specs/menus';
import usersSpec from './collection-specs/users';
import settingsSpec from './collection-specs/settings';
import sessionsSpec from './collection-specs/sessions';
import documentsSpec from './collection-specs/documents';
import menuLocksSpec from './collection-specs/menu-locks';
import documentLocksSpec from './collection-specs/document-locks';
import documentOrdersSpec from './collection-specs/document-orders';
import documentRevisionsSpec from './collection-specs/document-revisions';
import passwordResetRequestsSpec from './collection-specs/password-reset-requests';
import { migrate } from './db-migrate';

const MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT = 86;

const logger = new Logger(__filename);

const collectionSpecs = [
  menusSpec,
  usersSpec,
  settingsSpec,
  sessionsSpec,
  documentsSpec,
  menuLocksSpec,
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

  static async create({ connectionString, skipDbMigration }) {

    const database = new Database(connectionString);
    await database.connect();

    if (!skipDbMigration) {
      try {
        logger.info('Starting migrations');
        await migrate(database._mongoClient);
        logger.info('Finished migrations successfully');
      } catch (error) {
        logger.error(error);
        Graceful.exit(1);
      }
    }

    await database.createCollections();
    return database;
  }
}

export default Database;
