import GithubFlavoredMarkdown from '../src/common/github-flavored-markdown.js';

export default class Educandu_2023_11_30_03_add_cdn_resources_to_settings {
  constructor(db) {
    this.db = db;
    this.gfm = new GithubFlavoredMarkdown();
  }

  _getFlattenedCdnResources(texts) {
    const allCdnResources = texts.flatMap(text => this.gfm.extractCdnResources(text));
    return [...new Set(allCdnResources)].sort();
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

  async up() {
    const cursor = this.db.collection('settings').find();
    while (await cursor.hasNext()) {
      const setting = await cursor.next();
      const cdnResources = this._extractCdnResources(setting._id, setting.value);
      await this.db.collection('settings').updateOne({ _id: setting._id }, { $set: { cdnResources } });
      console.log(`Migrated setting with ID '${setting._id}'`);
    }
  }

  down() {
    throw Error('Not supported');
  }
}
