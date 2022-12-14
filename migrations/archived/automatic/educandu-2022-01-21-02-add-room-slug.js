export default class Educandu_2022_01_21_02_add_room_slug {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').updateMany({}, { $set: { slug: '' } });
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { slug: '' } });
  }
}
