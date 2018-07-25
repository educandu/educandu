const { MongoClient } = require('mongodb');

class Database {
  constructor(mongoClient) {
    this._mongoClient = mongoClient;
    this._db = this._mongoClient.db();
    this.users = this._db.collection(Database.DB_COLLECTION_NAME_USERS);
    this.sessions = this._db.collection(Database.DB_COLLECTION_NAME_SESSIONS);
    this.sections = this._db.collection(Database.DB_COLLECTION_NAME_SECTIONS);
    this.documents = this._db.collection(Database.DB_COLLECTION_NAME_DOCUMENTS);
    this.documentLocks = this._db.collection(Database.DB_COLLECTION_NAME_DOCUMENT_LOCKS);
    this.sectionOrders = this._db.collection(Database.DB_COLLECTION_NAME_SECTION_ORDERS);
    this.documentOrders = this._db.collection(Database.DB_COLLECTION_NAME_DOCUMENT_ORDERS);
    this.documentSnapshots = this._db.collection(Database.DB_COLLECTION_NAME_DOCUMENT_SNAPSHOTS);
    this.passwordResetRequests = this._db.collection(Database.DB_COLLECTION_NAME_PASSWORD_RESET_REQUESTS);
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

Database.DB_COLLECTION_NAME_USERS = 'users';
Database.DB_COLLECTION_NAME_SESSIONS = 'sessions';
Database.DB_COLLECTION_NAME_SECTIONS = 'sections';
Database.DB_COLLECTION_NAME_DOCUMENTS = 'documents';
Database.DB_COLLECTION_NAME_DOCUMENT_LOCKS = 'documentLocks';
Database.DB_COLLECTION_NAME_SECTION_ORDERS = 'sectionOrders';
Database.DB_COLLECTION_NAME_DOCUMENT_ORDERS = 'documentOrders';
Database.DB_COLLECTION_NAME_DOCUMENT_SNAPSHOTS = 'documentSnapshots';
Database.DB_COLLECTION_NAME_PASSWORD_RESET_REQUESTS = 'passwordResetRequests';

module.exports = Database;


