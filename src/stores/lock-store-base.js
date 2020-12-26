import StoreBase from './store-base';

class LockStoreBase extends StoreBase {
  async takeLock(lockKey) {
    await this.collection.insertOne({ _id: lockKey });
  }

  async releaseLock(lockKey) {
    await this.collection.deleteOne({ _id: lockKey });
  }
}

export default LockStoreBase;
