const { MongoClient } = require('mongodb');

const DB_COLLECTION_NAME_DOCUMENT_SNAPSHOTS = 'documentSnapshots';
const DB_COLLECTION_NAME_DOCUMENT_ORDERS = 'documentOrders';
const DB_COLLECTION_NAME_DOCUMENT_LOCKS = 'documentLocks';
const DB_COLLECTION_NAME_DOCUMENTS = 'documents';

class Database {
  constructor(mongoClient) {
    this._mongoClient = mongoClient;
    this._db = this._mongoClient.db();
    this.documentSnapshots = this._db.collection(DB_COLLECTION_NAME_DOCUMENT_SNAPSHOTS);
    this.documentOrders = this._db.collection(DB_COLLECTION_NAME_DOCUMENT_ORDERS);
    this.documentLocks = this._db.collection(DB_COLLECTION_NAME_DOCUMENT_LOCKS);
    this.documents = this._db.collection(DB_COLLECTION_NAME_DOCUMENTS);
  }

  async dispose() {
    await this._mongoClient.close();
  }

  static async create(dbConnectionString) {
    const mongoClient = await MongoClient.connect(dbConnectionString);
    return new Database(mongoClient);
  }
}

module.exports = Database;
