import moment from 'moment';
import StoreBase from './store-base.js';
import uniqueId from '../utils/unique-id.js';

class LockStoreBase extends StoreBase {
  constructor(collection, expirationTimeInMinutes = null) {
    super(collection);
    this.expirationTimeInMinutes = expirationTimeInMinutes;
  }

  async takeLock(lockKey) {
    const sessionKey = uniqueId.create();
    const expires = this.expirationTimeInMinutes ? moment().add(this.expirationTimeInMinutes, 'minutes').toDate() : null;
    await this.collection.insertOne({ _id: lockKey, sessionKey, expires });
    return { lockKey, sessionKey, expires };
  }

  async releaseLock(lock) {
    await this.collection.deleteOne({ _id: lock.lockKey, sessionKey: lock.sessionKey });
  }
}

export default LockStoreBase;
