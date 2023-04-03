export default class Educandu_2023_03_27_02_add_shortDescription_to_rooms_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').updateMany({}, { $set: { shortDescription: '' } });
    await this.db.collection('rooms').updateMany({}, { $rename: { description: 'overview' } });
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { shortDescription: null } });
    await this.db.collection('rooms').updateMany({}, { $rename: { overview: 'description' } });
  }
}
