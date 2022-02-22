import moment from 'moment';
import StoreBase from './store-base.js';
import uniqueId from '../utils/unique-id.js';

class LockStoreBase extends StoreBase {
  async takeLock({ type, key, expirationTimeInMinutes }) {
    const expires = expirationTimeInMinutes ? moment().add(expirationTimeInMinutes, 'minutes').toDate() : null;

    const lock = {
      _id: uniqueId.create(),
      type,
      key,
      sessionKey: uniqueId.create(),
      expires
    };

    await this.collection.insertOne(lock);
    return lock;
  }

  async releaseLock(lock) {
    await this.collection.deleteOne({ type: lock.type, key: lock.key, sessionKey: lock.sessionKey });
  }
}

export default LockStoreBase;
