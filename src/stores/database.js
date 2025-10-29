import by from 'thenby';
import url from 'node:url';
import path from 'node:path';
import Logger from '../common/logger.js';
import { readdir } from 'node:fs/promises';
import { Umzug, MongoDBStorage } from 'umzug';
import usersSpec from './collection-specs/users.js';
import tasksSpec from './collection-specs/tasks.js';
import roomsSpec from './collection-specs/rooms.js';
import locksSpec from './collection-specs/locks.js';
import eventsSpec from './collection-specs/events.js';
import batchesSpec from './collection-specs/batches.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import settingsSpec from './collection-specs/settings.js';
import sessionsSpec from './collection-specs/sessions.js';
import documentsSpec from './collection-specs/documents.js';
import storagePlansSpec from './collection-specs/storage-plans.js';
import notificationsSpec from './collection-specs/notifications.js';
import { DISPOSAL_PRIORITY, getDisposalInfo } from '../common/di.js';
import documentInputsSpec from './collection-specs/document-inputs.js';
import documentOrdersSpec from './collection-specs/document-orders.js';
import searchRequestsSpec from './collection-specs/search-requests.js';
import roomMediaItemsSpec from './collection-specs/room-media-items.js';
import documentRatingsSpec from './collection-specs/document-ratings.js';
import roomInvitationsSpec from './collection-specs/room-invitations.js';
import contactRequestsSpec from './collection-specs/contact-requests.js';
import mediaTrashItemsSpec from './collection-specs/media-trash-items.js';
import documentCommentsSpec from './collection-specs/document-comments.js';
import documentRequestsSpec from './collection-specs/document-requests.js';
import externalAccountsSpec from './collection-specs/external-accounts.js';
import documentRevisionsSpec from './collection-specs/document-revisions.js';
import mediaLibraryItemsSpec from './collection-specs/media-library-items.js';
import documentCategoriesSpec from './collection-specs/document-categories.js';
import requestLimitRecordsSpec from './collection-specs/request-limit-records.js';
import dailyDocumentRequestsSpec from './collection-specs/daily-document-requests.js';
import passwordResetRequestsSpec from './collection-specs/password-reset-requests.js';
import documentInputMediaItemsSpec from './collection-specs/document-input-media-items.js';

const MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT = 86;
const MIGRATION_FILE_NAME_PATTERN = /^educandu-\d{4}-\d{2}-\d{2}-.*(?<!\.spec)(?<!\.specs)(?<!\.test)\.js$/;

const logger = new Logger(import.meta.url);

const collectionSpecs = [
  usersSpec,
  tasksSpec,
  locksSpec,
  roomsSpec,
  eventsSpec,
  batchesSpec,
  settingsSpec,
  sessionsSpec,
  documentsSpec,
  storagePlansSpec,
  notificationsSpec,
  documentInputsSpec,
  documentOrdersSpec,
  searchRequestsSpec,
  roomMediaItemsSpec,
  documentRatingsSpec,
  roomInvitationsSpec,
  contactRequestsSpec,
  mediaTrashItemsSpec,
  documentCommentsSpec,
  documentRequestsSpec,
  externalAccountsSpec,
  documentRevisionsSpec,
  mediaLibraryItemsSpec,
  documentCategoriesSpec,
  requestLimitRecordsSpec,
  dailyDocumentRequestsSpec,
  passwordResetRequestsSpec,
  documentInputMediaItemsSpec
];

class Database {
  constructor(connectionString) {
    this._db = null;
    this._mongoClient = null;
    this._connectionString = connectionString;
  }

  async connect() {
    logger.info('Trying to connect to MongoDB');
    const mongoOptions = { serverApi: ServerApiVersion.v1 };
    this._mongoClient = await MongoClient.connect(this._connectionString, mongoOptions);
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

  async runMigrationScripts() {
    const umzug = await this._generateUmzug();
    await umzug.up();
  }

  async _generateUmzug() {
    const migrationsDirectory = url.fileURLToPath(new URL('../../migrations', import.meta.url));
    let allPossibleMigrationFiles = await readdir(path.resolve(migrationsDirectory), { withFileTypes: true });

    allPossibleMigrationFiles = allPossibleMigrationFiles
      .filter(obj=> obj.isFile())
      .map(file => path.resolve(migrationsDirectory, file.name));

    const migrationFileNames = allPossibleMigrationFiles
      .filter(fileName => MIGRATION_FILE_NAME_PATTERN.test(path.basename(fileName)))
      .sort(by(fileName => path.basename(fileName)));

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

    return umzug;
  }

  static async create({ connectionString }) {
    const database = new Database(connectionString);
    await database.connect();
    return database;
  }
}

export default Database;
