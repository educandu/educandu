export default class Educandu_2022_02_25_01_add_password_reset_expiry_index {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('passwordResetRequests').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.collection('passwordResetRequests').dropIndex('_idx_expires_');
  }
}
