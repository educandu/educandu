/* eslint-disable camelcase */
export default class Educandu_2022_02_15_01_add_storage_plans {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('storagePlans');

    await this.db.collection('storagePlans').createIndexes([
      {
        name: '_idx_name',
        key: { name: 1 },
        unique: true
      }
    ]);

    await this.db.collection('storagePlans').insertOne({
      _id: 'bAaLpGNskfCZ4MBfGiDCQg',
      name: 'basic',
      maxBytes: 500 * 1000 * 1000
    });
  }

  async down() {
    await this.db.dropCollection('storagePlans');
  }
}
