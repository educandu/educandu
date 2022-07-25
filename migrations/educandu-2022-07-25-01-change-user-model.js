/* eslint-disable camelcase */

export default class Educandu_2022_07_25_01_change_user_model {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $unset: { profile: null } });
    await this.db.collection('users').updateMany({}, { $set: { organization: null, introduction: null } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $set: { profile: {} } });
    await this.db.collection('users').updateMany({}, { $unset: { organization: null, introduction: null } });
  }
}
