import SettingStore from '../stores/setting-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';
import { consolidateCdnResourcesForSaving } from '../utils/cdn-resource-utils.js';

class SettingService {
  static dependencies = [SettingStore, TransactionRunner, GithubFlavoredMarkdown];

  constructor(settingStore, transactionRunner, githubFlavoredMarkdown) {
    this.settingStore = settingStore;
    this.transactionRunner = transactionRunner;
    this.githubFlavoredMarkdown = githubFlavoredMarkdown;
  }

  async getAllSettings() {
    const settings = await this.settingStore.getAllSettings();
    return Object.fromEntries(settings.map(({ _id, value }) => [_id, value]));
  }

  saveSettings(settings) {
    const updatedSettings = Object.entries(settings).map(([_id, value]) => ({
      _id,
      value,
      cdnResources: this._extractCdnResources({ _id, value })
    }));

    return this.settingStore.saveSettings(updatedSettings);
  }

  async consolidateCdnResources(settingId) {
    await this.transactionRunner.run(async session => {
      const setting = await this.settingStore.getSettingById(settingId, { session });
      const consolidatedSetting = { ...setting, cdnResources: this._extractCdnResources(setting) };
      await this.settingStore.saveSetting(consolidatedSetting, { session });
    });
  }

  _extractCdnResources({ _id, value }) {
    switch (_id) {
      case 'consentText':
        return this._getFlattenedCdnResources(Object.values(value));
      case 'pluginsHelpTexts':
        return this._getFlattenedCdnResources(Object.values(value).flatMap(plugin => Object.values(plugin)));
      default:
        return [];
    }
  }

  _getFlattenedCdnResources(texts) {
    const rawCdnResources = texts.flatMap(text => this.githubFlavoredMarkdown.extractCdnResources(text));
    return consolidateCdnResourcesForSaving(rawCdnResources);
  }
}

export default SettingService;
