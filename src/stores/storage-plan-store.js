import Database from './database.js';
import StoreBase from './store-base.js';

class StoragePlanStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.storagePlans);
  }
}

export default StoragePlanStore;
