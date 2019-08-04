const SettingStore = require('../stores/setting-store');

class SettingService {
  static get inject() { return [SettingStore]; }

  constructor(settingStore) {
    this.settingStore = settingStore;
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
