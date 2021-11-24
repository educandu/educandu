import { add } from 'date-fns';
import StoreBase from './store-base.js';
import uniqueId from '../utils/unique-id.js';

class LockStoreBase extends StoreBase {
  constructor(collection, expirationTimeSpan = null) {
    super(collection);
    this.expirationTimeSpan = expirationTimeSpan;
  }

  async takeLock(lockKey) {
    const sessionKey = uniqueId.create();
    const expires = this.expirationTimeSpan ? add(new Date(), this.expirationTimeSpan) : null;
    await this.collection.insertOne({ _id: lockKey, sessionKey, expires });
    return { lockKey, sessionKey, expires };
  }

  async releaseLock(lock) {
    await this.collection.deleteOne({ _id: lock.lockKey, sessionKey: lock.sessionKey });
  }
}

export default LockStoreBase;
