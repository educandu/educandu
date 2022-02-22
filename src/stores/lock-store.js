import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

const LOCK_TYPE = {
  room: 'room',
  task: 'task',
  batch: 'batch',
  document: 'document',
  maintenance: 'maintenance'
};

class LockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.locks);
  }

  takeRoomLock(key) {
    return this.takeLock({ type: LOCK_TYPE.room, key, expirationTimeInMinutes: 1 });
  }

  takeTaskLock(key) {
    return this.takeLock({ type: LOCK_TYPE.task, key, expirationTimeInMinutes: 10 });
  }

  takeBatchLock(key) {
    return this.takeLock({ type: LOCK_TYPE.batch, key, expirationTimeInMinutes: 1 });
  }

  takeDocumentLock(key) {
    return this.takeLock({ type: LOCK_TYPE.document, key, expirationTimeInMinutes: 1 });
  }

  takeMaintenanceLock(key) {
    return this.takeLock({ type: LOCK_TYPE.maintenance, key, expirationTimeInMinutes: 30 });
  }
}

export default LockStore;
