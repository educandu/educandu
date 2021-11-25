import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

class BatchLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.batchLocks);
  }
}

export default BatchLockStore;
