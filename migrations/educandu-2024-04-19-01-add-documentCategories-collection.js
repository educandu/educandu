export default class Educandu_2024_04_19_01_add_documentCategories_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentCategories');
    await this.db.collection('documentCategories').createIndexes([
      {
        name: '_idx_name_',
        key: { name: 1 },
        unique: true
      },
      {
        name: '_idx_documentIds_',
        key: { documentIds: 1 }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentCategories');
  }
}
