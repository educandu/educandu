const SettingStore = require('../stores/setting-store');

class SettingService {
  static get inject() { return [SettingStore]; }

  constructor(settingStore) {
    this.settingStore = settingStore;
  }

  async getAllSettings() {
    const settings = await this.settingStore.find({});
    return settings.reduce((all, { _id, value }) => {
      all[_id] = value;
      return all;
    }, {});
  }

  saveSettings(settings) {
    return Promise.all(Object.keys(settings).map(key => this.settingStore.save({ _id: key, value: settings[key] })));
  }

  async getLandingPageDocumentId() {
    const setting = await this.settingStore.findOne({ query: { _id: 'landingPageDocumentId' } });
    return setting ? setting.value : null;
  }

  async setLandingPageDocumentId(docId) {
    await this.settingStore.save({ _id: 'landingPageDocumentId', value: docId });
  }
}

module.exports = SettingService;
