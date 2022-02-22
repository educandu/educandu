import Database from './database.js';
import StoreBase from './store-base.js';

class StoragePlanStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.storagePlans);
  }

  getAllStoragePlans() {
    return this.find();
  }

  getStoragePlanById(id) {
    return this.findOne({ _id: id });
  }
}

export default StoragePlanStore;
