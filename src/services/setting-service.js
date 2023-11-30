import SettingStore from '../stores/setting-store.js';
import { ensureIsUnique } from '../utils/array-utils.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

class SettingService {
  static dependencies = [SettingStore, GithubFlavoredMarkdown];

  constructor(settingStore, githubFlavoredMarkdown) {
    this.settingStore = settingStore;
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
      cdnResources: this._extractCdnResources(_id, value)
    }));

    return this.settingStore.saveSettings(updatedSettings);
  }

  _extractCdnResources(_id, value) {
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
    const allCdnResources = texts.flatMap(text => this.githubFlavoredMarkdown.extractCdnResources(text));
    return ensureIsUnique(allCdnResources).sort();
  }
}

export default SettingService;
