export default class Educandu_2022_04_12_01_add_updatedBy_index_to_lessons {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('lessons').createIndexes([
      {
        name: '_idx_updated_by_',
        key: { updatedBy: -1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('lessons').dropIndex('_idx_updated_by_');
  }
}
