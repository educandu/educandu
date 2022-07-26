/* eslint-disable camelcase */

export default class Educandu_2022_07_22_01_rename_username_to_displayName {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').dropIndex('_idx_username_provider_');
    await this.db.collection('users').updateMany({}, { $rename: { username: 'displayName' } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $rename: { displayName: 'username' } });
    await this.db.collection('users').createIndexes([
      {
        name: '_idx_username_provider_',
        key: { username: 1, provider: 1 },
        unique: true
      }
    ]);
  }
}
