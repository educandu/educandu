export default class Educandu_2025_04_10_01_add_searchRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('searchRequests');
    await this.db.collection('searchRequests').createIndexes([
      {
        name: '_idx_expiresOn_',
        key: { expiresOn: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('searchRequests');
  }
}
