/* eslint-disable camelcase, no-console, no-await-in-loop */

export default class Educandu_2022_07_18_03_rename_lessonsMode_in_rooms {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').update({}, { $rename: { lessonsMode: 'documentsMode' } });
  }

  async down() {
    await this.db.collection('rooms').update({}, { $rename: { documentsMode: 'lessonsMode' } });
  }
}
