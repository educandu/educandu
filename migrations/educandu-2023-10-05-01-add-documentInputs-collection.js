export default class Educandu_2023_10_05_01_add_documentInputs_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentInputs');
    await this.db.collection('documentInputs').createIndexes([
      {
        name: '_idx_documentId_',
        key: { documentId: 1 }
      },
      {
        name: '_idx_createdBy_',
        key: { createdBy: 1 }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentInputs');
  }
}
