/* eslint-disable camelcase */
export default class Educandu_2022_01_04_03_remove_home_languages_from_settings {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('settings').deleteOne({ _id: 'homeLanguages' });
  }

  down() {
    throw new Error('Not implemented');
  }
}
