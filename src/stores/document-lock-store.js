import Database from '../stores/database.js';
import LockStoreBase from './lock-store-base.js';

const LOCK_EXPIRATION_TIME_SPAN = { minutes: 30 };

class DocumentLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentLocks, LOCK_EXPIRATION_TIME_SPAN);
  }
}

export default DocumentLockStore;
