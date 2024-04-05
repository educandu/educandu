export default class Educandu_2024_04_04_02_add_documentRatings_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentRatings');
    await this.db.collection('documentRatings').createIndexes([
      {
        name: '_idx_documentId_',
        key: { documentId: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentRatings');
  }
}
