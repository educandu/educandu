export default class Educandu_2022_12_20_01_create_requestLimitRecords_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('requestLimitRecords');
    await this.db.collection('requestLimitRecords').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('requestLimitRecords');
  }
}
