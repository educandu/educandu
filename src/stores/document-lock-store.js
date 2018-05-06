const Database = require('../stores/database');

class DocumentLockStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.documentLocks = db.documentLocks;
  }

  async takeDocumentLock(documentId) {
    await this.documentLocks.insertOne({ _id: documentId });
  }

  async releaseDocumentLock(documentId) {
    await this.documentLocks.deleteOne({ _id: documentId });
  }
}

module.exports = DocumentLockStore;
