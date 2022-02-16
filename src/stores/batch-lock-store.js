import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

const LOCK_EXPIRATION_TIME_SPAN = { minutes: 1 };

class BatchLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.batchLocks, LOCK_EXPIRATION_TIME_SPAN);
  }
}

export default BatchLockStore;
