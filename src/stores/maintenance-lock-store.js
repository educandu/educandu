import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

const LOCK_EXPIRATION_TIME_IN_MINUTES = 30;

class MaintenanceLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.maintenanceLocks, LOCK_EXPIRATION_TIME_IN_MINUTES);
  }
}

export default MaintenanceLockStore;
