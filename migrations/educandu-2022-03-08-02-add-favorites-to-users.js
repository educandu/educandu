/* eslint-disable camelcase */
export default class Educandu_2022_03_08_02_add_favorites_to_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { favorites: [] } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { favorites: null } });
  }
}
