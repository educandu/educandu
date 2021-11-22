import url from 'url';
import path from 'path';
import glob from 'glob';
import { promisify } from 'util';
import { MongoClient } from 'mongodb';
import Logger from '../common/logger.js';
import { Umzug, MongoDBStorage } from 'umzug';
import usersSpec from './collection-specs/users.js';
import settingsSpec from './collection-specs/settings.js';
import sessionsSpec from './collection-specs/sessions.js';
import documentsSpec from './collection-specs/documents.js';
import documentLocksSpec from './collection-specs/document-locks.js';
import documentOrdersSpec from './collection-specs/document-orders.js';
import documentRevisionsSpec from './collection-specs/document-revisions.js';
import passwordResetRequestsSpec from './collection-specs/password-reset-requests.js';

const pGlob = promisify(glob);

const MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT = 86;
const MIGRATION_FILE_NAME_PATTERN = /^educandu-\d{4}-\d{2}-\d{2}-.*\.js$/;

const logger = new Logger(import.meta.url);

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
    collectionSpecs.forEach(spec => {
      this[spec.name] = this._db.collection(spec.name);
    });
  }

  async checkDb() {
    await Promise.all(collectionSpecs.map(collectionSpec => this.createCollection(collectionSpec)));
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
  }

  async dispose() {
    logger.info('Closing MongoDB connection');
    await this._mongoClient.close();
  }

  async runMigrationScripts() {
    const migrationsDirectory = url.fileURLToPath(new URL('../../migrations', import.meta.url));
    const allFilesInMigrationDirectory = await pGlob(path.resolve(migrationsDirectory, './*.js'));
    const migrationFileNames = allFilesInMigrationDirectory
      .filter(fileName => MIGRATION_FILE_NAME_PATTERN.test(path.basename(fileName)))
      .filter(filename => !filename.endsWith('-manually-run.js'))
      .sort();

    const migrations = await Promise.all(migrationFileNames.map(async fileName => {
      const Migration = (await import(url.pathToFileURL(fileName).href)).default;
      const instance = new Migration(this._db, this._mongoClient);
      instance.name = path.basename(fileName, '.js');
      return instance;
    }));

    const umzug = new Umzug({
      migrations,
      storage: new MongoDBStorage({ collection: this._db.collection('migrations') }),
      logger
    });

    umzug.on('migrated', ({ name }) => logger.info(`Finished migrating ${name}`));

    await umzug.up();
  }

  static async create({ connectionString }) {
    const database = new Database(connectionString);
    await database.connect();
    return database;
  }
}

export default Database;
