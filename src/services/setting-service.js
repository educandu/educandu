import SettingStore from '../stores/setting-store.js';

class SettingService {
  static get inject() { return [SettingStore]; }

  constructor(settingStore) {
    this.settingStore = settingStore;
  }

  async getAllSettings() {
    const settings = await this.settingStore.getAllSettings();
    return settings.reduce((all, { _id, value }) => {
      all[_id] = value;
      return all;
    }, {});
  }

  saveSettings(settings) {
    return Promise.all(Object.keys(settings).map(key => this.settingStore.saveSetting(settings[key])));
  }
}

export default SettingService;
