const Logger = require('../common/logger');
const { MongoClient } = require('mongodb');
const menusSpec = require('./collection-specs/menus');
const usersSpec = require('./collection-specs/users');
const settingsSpec = require('./collection-specs/settings');
const sessionsSpec = require('./collection-specs/sessions');
const sectionsSpec = require('./collection-specs/sections');
const documentsSpec = require('./collection-specs/documents');
const menuLocksSpec = require('./collection-specs/menu-locks');
const documentLocksSpec = require('./collection-specs/document-locks');
const sectionOrdersSpec = require('./collection-specs/section-orders');
const documentOrdersSpec = require('./collection-specs/document-orders');
const documentSnapshotsSpec = require('./collection-specs/document-snapshots');
const passwordResetRequestsSpec = require('./collection-specs/password-reset-requests');

const MONGO_ERROR_CODE_INDEX_KEY_SPECS_CONFLICT = 86;

const logger = new Logger(__filename);

const collectionSpecs = [
  menusSpec,
  usersSpec,
  settingsSpec,
  sessionsSpec,
  sectionsSpec,
  documentsSpec,
  menuLocksSpec,
  documentLocksSpec,
  sectionOrdersSpec,
  documentOrdersSpec,
  documentSnapshotsSpec,
  passwordResetRequestsSpec
];

class Database {
  constructor(connectionString) {
    this._connectionString = connectionString;
  }

  async connect() {
    logger.info('Trying to connect to MongoDB');
    this._mongoClient = await MongoClient.connect(this._connectionString);
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

    logger.info('Creating MongoDB collection %s', collectionName);
    const collection = await this._db.createCollection(collectionName);

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

  static async create({ connectionString }) {
    const database = new Database(connectionString);
    await database.connect();
    await database.createCollections();
    return database;
  }
}

module.exports = Database;
