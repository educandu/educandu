import Database from '../stores/database.js';
import LockStoreBase from './lock-store-base.js';

class DocumentLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentLocks);
  }
}

export default DocumentLockStore;
