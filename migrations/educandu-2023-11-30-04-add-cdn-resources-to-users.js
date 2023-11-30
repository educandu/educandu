import GithubFlavoredMarkdown from '../src/common/github-flavored-markdown.js';

export default class Educandu_2023_11_30_04_add_cdn_resources_to_users {
  constructor(db) {
    this.db = db;
    this.gfm = new GithubFlavoredMarkdown();
  }

  async up() {
    const cursor = this.db.collection('users').find();
    while (await cursor.hasNext()) {
      const user = await cursor.next();
      const cdnResources = this.gfm.extractCdnResources(user.profileOverview);
      await this.db.collection('users').updateOne({ _id: user._id }, { $set: { cdnResources } });
      console.log(`Migrated user with ID '${user._id}'`);
    }
  }

  down() {
    throw Error('Not supported');
  }
}
