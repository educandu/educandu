/* eslint-disable camelcase */
export default class Educandu_2022_03_08_01_remove_announcement_from_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').deleteOne({ _id: 'announcement' });
  }

  async down() {
    await this.db.collection('settings').insertOne({ _id: 'announcement', value: '' });
  }
}
