import moment from 'moment';
import Database from './database.js';
import uniqueId from '../utils/unique-id.js';

const LOCK_TYPE = {
  user: 'user',
  room: 'room',
  task: 'task',
  batch: 'batch',
  event: 'event',
  document: 'document',
  storagePlan: 'storage-plan',
  maintenance: 'maintenance',
  documentCategory: 'document-category',
};

class LockStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.locks;
  }

  takeUserLock(key) {
    return this._takeLock({ type: LOCK_TYPE.user, key, expirationTimeInMinutes: 1 });
  }

  takeRoomLock(key) {
    return this._takeLock({ type: LOCK_TYPE.room, key, expirationTimeInMinutes: 1 });
  }

  takeTaskLock(key) {
    return this._takeLock({ type: LOCK_TYPE.task, key, expirationTimeInMinutes: 1 });
  }

  takeBatchLock(key) {
    return this._takeLock({ type: LOCK_TYPE.batch, key, expirationTimeInMinutes: 1 });
  }

  takeEventLock(key) {
    return this._takeLock({ type: LOCK_TYPE.event, key, expirationTimeInMinutes: 5 });
  }

  takeDocumentLock(key) {
    return this._takeLock({ type: LOCK_TYPE.document, key, expirationTimeInMinutes: 1 });
  }

  takeStoragePlanLock(key) {
    return this._takeLock({ type: LOCK_TYPE.storagePlan, key, expirationTimeInMinutes: 1 });
  }

  takeMaintenanceLock(key) {
    return this._takeLock({ type: LOCK_TYPE.maintenance, key, expirationTimeInMinutes: 30 });
  }

  takeDocumentCategoryLock(key) {
    return this._takeLock({ type: LOCK_TYPE.documentCategory, key, expirationTimeInMinutes: 1 });
  }

  async releaseLock(lock) {
    await this.collection.deleteOne({ type: lock.type, key: lock.key });
  }

  async _takeLock({ type, key, expirationTimeInMinutes }) {
    const expiresOn = expirationTimeInMinutes ? moment().add(expirationTimeInMinutes, 'minutes').toDate() : null;

    const lock = { _id: uniqueId.create(), type, key, expiresOn };

    await this.collection.insertOne(lock);
    return lock;
  }
}

export default LockStore;
