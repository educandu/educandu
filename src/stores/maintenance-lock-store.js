import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

const MAINTENANCE_LOCK_EXPIRATION_TIME_SPAN = { minutes: 30 };

class MaintenanceLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.maintenanceLocks, MAINTENANCE_LOCK_EXPIRATION_TIME_SPAN);
  }
}

export default MaintenanceLockStore;
