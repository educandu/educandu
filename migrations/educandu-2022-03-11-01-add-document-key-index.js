// eslint-disable-next-line camelcase
export default class Educandu_2022_03_11_01_add_document_key_index {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_key_',
        key: { key: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('documents').dropIndex('_idx_key_');
  }
}
