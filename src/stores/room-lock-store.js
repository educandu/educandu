import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

class RoomLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.batchLocks);
  }
}

export default RoomLockStore;
