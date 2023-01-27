export default class Educandu_2023_01_27_01_add_controbutors_index_to_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_contributors_',
        key: { contributors: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('documents').dropIndex('_idx_contributors_');
  }
}
