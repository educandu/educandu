import url from 'url';
import md5 from 'md5';
import path from 'path';
import glob from 'glob';
import memoizee from 'memoizee';
import { promisify } from 'util';
import { MongoClient } from 'mongodb';
import Logger from '../common/logger.js';
import { Umzug, MongoDBStorage } from 'umzug';
import usersSpec from './collection-specs/users.js';
import tasksSpec from './collection-specs/tasks.js';
import roomsSpec from './collection-specs/rooms.js';
import lessonsSpec from './collection-specs/lessons.js';
import batchesSpec from './collection-specs/batches.js';
import settingsSpec from './collection-specs/settings.js';
import sessionsSpec from './collection-specs/sessions.js';
import documentsSpec from './collection-specs/documents.js';
import taskLocksSpec from './collection-specs/task-locks.js';
import batchLocksSpec from './collection-specs/batch-locks.js';
import { DISPOSAL_PRIORITY, getDisposalInfo } from '../common/di.js';
import documentLocksSpec from './collection-specs/document-locks.js';
import documentOrdersSpec from './collection-specs/document-orders.js';
import roomInvitationsSpec from './collection-specs/room-invitations.js';
import documentRevisionsSpec from './collection-specs/document-revisions.js';
import passwordResetRequestsSpec from './collection-specs/password-reset-requests.js';

const pGlob = promisify(glob);

const MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT = 86;
const MIGRATION_FILE_NAME_PATTERN = /^educandu-\d{4}-\d{2}-\d{2}-.*(?<!\.spec)(?<!\.specs)(?<!\.test)\.js$/;

const logger = new Logger(import.meta.url);

const collectionSpecs = [
  usersSpec,
  tasksSpec,
  batchesSpec,
  settingsSpec,
  sessionsSpec,
  documentsSpec,
  taskLocksSpec,
  batchLocksSpec,
  documentLocksSpec,
  documentOrdersSpec,
  documentRevisionsSpec,
  passwordResetRequestsSpec,
  roomInvitationsSpec,
  roomsSpec,
  lessonsSpec
];

class Database {
  constructor(connectionString) {
    this._connectionString = connectionString;
    this.getSchemaHash = memoizee(this._generateSchemaHash);
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

  startSession() {
    return this._mongoClient.startSession();
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
      logger.info(`Collection ${collectionName} already exists. Skipping creation.`);
    } else {
      logger.info(`Creating collection ${collectionName} on MongoDB.`);
      await this._db.createCollection(collectionName);
    }

    const collection = this._db.collection(collectionName);

    if (indexes.length) {
      try {
        logger.info(`Creating ${indexes.length} indexes on MongoDB collection ${collectionName}`);
        await collection.createIndexes(indexes);
      } catch (error) {
        if (error.code === MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT) {
          logger.info(`Indexes on MongoDB collection ${collectionName} seem to have changes. Dropping old ones.`);
          await collection.dropIndexes();
          logger.info(`Creating ${indexes.length} indexes on MongoDB collection ${collectionName}`);
          await collection.createIndexes(indexes);
        } else {
          throw error;
        }
      }
    }
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.storage,
      dispose: async () => {
        logger.info('Closing MongoDB connection');
        await this._mongoClient.close();
        logger.info('MongoDB connection closed');
      }
    };
  }

  async runMigrationScripts(includeManualMigrations = false) {
    const migrationsDirectory = url.fileURLToPath(new URL('../../migrations', import.meta.url));
    const allPossibleMigrationFiles = await pGlob(path.resolve(migrationsDirectory, './automatic/*.js'));

    if (includeManualMigrations) {
      allPossibleMigrationFiles.push(...await pGlob(path.resolve(migrationsDirectory, './manual/*.js')));
    }

    const migrationFileNames = allPossibleMigrationFiles
      .filter(fileName => MIGRATION_FILE_NAME_PATTERN.test(path.basename(fileName)))
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

  async _generateSchemaHash() {
    const migrations = await this._db.collection('migrations').find({}).toArray();
    const migrationNames = migrations.map(migration => migration.migrationName).sort().join();

    return md5(migrationNames);
  }

  static async create({ connectionString }) {
    const database = new Database(connectionString);
    await database.connect();
    return database;
  }
}

export default Database;
