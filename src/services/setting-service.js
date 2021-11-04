import SettingStore from '../stores/setting-store.js';

class SettingService {
  static get inject() { return [SettingStore]; }

  constructor(settingStore) {
    this.settingStore = settingStore;
    this.defaultSettings = {
      homeLanguages: [],
      helpPage: {
        linkTitle: '',
        documentNamespace: '',
        documentSlug: ''
      },
      termsPage: {
        linkTitle: '',
        documentNamespace: '',
        documentSlug: ''
      },
      footerLinks: [],
      defaultTags: []
    };
  }

  async getAllSettings() {
    const settings = await this.settingStore.find();
    if (!settings.length) {
      return this.defaultSettings;
    }

    return settings.reduce((all, { _id, value }) => {
      all[_id] = value;
      return all;
    }, {});
  }

  saveSettings(settings) {
    return Promise.all(Object.keys(settings).map(key => this.settingStore.save({ _id: key, value: settings[key] })));
  }
}

export default SettingService;
