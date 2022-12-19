export default class Educandu_2021_11_16_01_change_provider_name {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { provider: 'educandu' } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $set: { provider: 'elmu' } });
  }
}
