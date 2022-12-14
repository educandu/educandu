export default class Educandu_2022_02_22_01_add_non_empty_storage_to_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set:
      {
        storage: {
          plan: null,
          usedBytes: 0,
          reminders: []
        }
      } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { storage: null } });
  }
}
