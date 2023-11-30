import GithubFlavoredMarkdown from '../src/common/github-flavored-markdown.js';

export default class Educandu_2023_11_30_02_add_cdn_resources_to_rooms {
  constructor(db) {
    this.db = db;
    this.gfm = new GithubFlavoredMarkdown();
  }

  async up() {
    const cursor = this.db.collection('rooms').find();
    while (await cursor.hasNext()) {
      const room = await cursor.next();
      const cdnResources = this.gfm.extractCdnResources(room.overview);
      await this.db.collection('rooms').updateOne({ _id: room._id }, { $set: { cdnResources } });
      console.log(`Migrated room with ID ${room._id}`);
    }
  }

  down() {
    throw Error('Not supported');
  }
}
