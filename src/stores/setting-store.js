import Database from './database.js';
class SettingStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.settings;
  }

  getAllSettings() {
    return this.collection.find({}).toArray();
  }

  saveSettings(settings, { session } = {}) {
    return Promise.all(Object.keys(settings).map(key => {
      const setting = { _id: key, value: settings[key] };
      return this.collection.replaceOne({ _id: key }, setting, { session, upsert: true });
    }));
  }
}

export default SettingStore;
