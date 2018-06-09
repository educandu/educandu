const Database = require('../stores/database');
const LockStoreBase = require('./lock-store-base');

class DocumentLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentLocks);
  }
}

module.exports = DocumentLockStore;
