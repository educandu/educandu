import Database from './database.js';
class SettingStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.settings;
  }

  getAllSettings() {
    return this.collection.find({}).toArray();
  }

  saveSetting(setting, { session } = {}) {
    return this.collection.replaceOne({ _id: setting._id }, setting, { session, upsert: true });
  }
}

export default SettingStore;
