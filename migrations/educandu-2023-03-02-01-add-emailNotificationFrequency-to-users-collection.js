export default class Educandu_2023_03_02_01_add_emailNotificationFrequency_to_users_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { emailNotificationFrequency: 'weekly' } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { emailNotificationFrequency: null } });
  }
}
