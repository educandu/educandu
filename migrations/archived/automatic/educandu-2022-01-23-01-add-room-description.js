export default class Educandu_2022_01_23_01_add_room_description {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').updateMany({}, { $set: { description: '' } });
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { description: '' } });
  }
}
