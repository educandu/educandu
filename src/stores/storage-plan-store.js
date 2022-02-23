import Database from './database.js';

class StoragePlanStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.storagePlans;
  }

  getAllStoragePlans() {
    return this.collection.find().toArray();
  }

  getStoragePlanById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }
}

export default StoragePlanStore;
