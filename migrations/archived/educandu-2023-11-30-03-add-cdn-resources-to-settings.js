export default class Educandu_2023_11_30_03_add_cdn_resources_to_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const cursor = this.db.collection('settings').find();
    while (await cursor.hasNext()) {
      const setting = await cursor.next();
      await this.db.collection('settings').updateOne({ _id: setting._id }, { $set: { cdnResources: [] } });
      console.log(`Migrated setting with ID '${setting._id}'`);
    }
  }

  down() {
    throw Error('Not supported');
  }
}
