export default class Educandu_2024_11_08_01_add_allowContactRequestEmails_to_users_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { allowContactRequestEmails: true } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { allowContactRequestEmails: false } });
  }
}
