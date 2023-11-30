import Database from './database.js';

class SettingStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.settings;
  }

  getAllSettingIds({ session } = {}) {
    return this.collection.distinct('_id', {}, { session });
  }

  getSettingById(settingId, { session } = {}) {
    return this.collection.findOne({ _id: settingId }, { session });
  }

  getAllSettings() {
    return this.collection.find({}).toArray();
  }

  saveSetting(setting, { session } = {}) {
    return this.collection.replaceOne({ _id: setting._id }, setting, { session, upsert: true });
  }

  saveSettings(settings, { session } = {}) {
    return Promise.all(settings.map(setting => {
      return this.collection.replaceOne({ _id: setting._id }, setting, { session, upsert: true });
    }));
  }
}

export default SettingStore;
