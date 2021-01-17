import StoreBase from './store-base';
import uniqueId from '../utils/unique-id';

class LockStoreBase extends StoreBase {
  async takeLock(lockKey) {
    const sessionKey = uniqueId.create();
    await this.collection.insertOne({ _id: lockKey, sessionKey: sessionKey });
    return { lockKey, sessionKey };
  }

  async releaseLock(lock) {
    await this.collection.deleteOne({ _id: lock.lockKey, sessionKey: lock.sessionKey });
  }
}

export default LockStoreBase;
