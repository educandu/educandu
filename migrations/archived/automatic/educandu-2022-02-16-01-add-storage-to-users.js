export default class Educandu_2022_02_16_01_add_storage_to_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { storage: null } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { storage: null } });
  }
}
