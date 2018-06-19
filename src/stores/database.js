const { MongoClient } = require('mongodb');

const DB_COLLECTION_NAME_DOCUMENT_SNAPSHOTS = 'documentSnapshots';
const DB_COLLECTION_NAME_DOCUMENT_ORDERS = 'documentOrders';
const DB_COLLECTION_NAME_SECTION_ORDERS = 'sectionOrders';
const DB_COLLECTION_NAME_DOCUMENT_LOCKS = 'documentLocks';
const DB_COLLECTION_NAME_DOCUMENTS = 'documents';
const DB_COLLECTION_NAME_SECTIONS = 'sections';

class Database {
  constructor(mongoClient) {
    this._mongoClient = mongoClient;
    this._db = this._mongoClient.db();
    this.documentSnapshots = this._db.collection(DB_COLLECTION_NAME_DOCUMENT_SNAPSHOTS);
    this.documentOrders = this._db.collection(DB_COLLECTION_NAME_DOCUMENT_ORDERS);
    this.sectionOrders = this._db.collection(DB_COLLECTION_NAME_SECTION_ORDERS);
    this.documentLocks = this._db.collection(DB_COLLECTION_NAME_DOCUMENT_LOCKS);
    this.documents = this._db.collection(DB_COLLECTION_NAME_DOCUMENTS);
    this.sections = this._db.collection(DB_COLLECTION_NAME_SECTIONS);
  }

  async dispose() {
    await this._mongoClient.close();
    this._mongoClient = null;
  }

  static async create({ connectionString }) {
    const mongoClient = await MongoClient.connect(connectionString);
    return new Database(mongoClient);
  }
}

module.exports = Database;
