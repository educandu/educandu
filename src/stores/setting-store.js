import Database from './database.js';

class SettingStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.settings;
  }

  getAllSettings() {
    return this.collection.find({}).toArray();
  }

  saveSettings(settings, { session } = {}) {
    return Promise.all(settings.map(setting => {
      return this.collection.replaceOne({ _id: setting._id }, setting, { session, upsert: true });
    }));
  }
}

export default SettingStore;
