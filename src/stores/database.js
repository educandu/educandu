const { MongoClient } = require('mongodb');
const usersSpec = require('./collection-specs/users');
const sessionsSpec = require('./collection-specs/sessions');
const sectionsSpec = require('./collection-specs/sections');
const documentsSpec = require('./collection-specs/documents');
const documentLocksSpec = require('./collection-specs/document-locks');
const sectionOrdersSpec = require('./collection-specs/section-orders');
const documentOrdersSpec = require('./collection-specs/document-orders');
const documentSnapshotsSpec = require('./collection-specs/document-snapshots');
const passwordResetRequestsSpec = require('./collection-specs/password-reset-requests');

const collectionSpecs = [
  usersSpec,
  sessionsSpec,
  sectionsSpec,
  documentsSpec,
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
    this._mongoClient = await MongoClient.connect(this._connectionString);
    this._db = this._mongoClient.db();
  }

  async createCollections() {
    const promises = collectionSpecs.map(collectionSpec => this.createCollection(collectionSpec));
    await Promise.all(promises);
  }

  async createCollection(collectionSpec) {
    const collectionName = collectionSpec.name;
    const indexes = collectionSpec.indexes || [];

    const collection = await this._db.createCollection(collectionName);

    if (indexes.length) {
      await collection.createIndexes(indexes);
    }

    this[collectionName] = collection;
  }

  async dispose() {
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
