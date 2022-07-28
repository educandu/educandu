/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_04_11_01_add_lessonsMode_to_rooms {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').updateMany({}, { $set: { lessonsMode: 'exclusive' } });
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { lessonsMode: null } });
  }
}
