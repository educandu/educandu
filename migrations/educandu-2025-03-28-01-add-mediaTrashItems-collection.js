export default class Educandu_2025_03_28_01_add_mediaTrashItems_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('mediaTrashItems');
    await this.db.collection('mediaTrashItems').createIndexes([
      {
        name: '_idx_createdOn_',
        key: { createdOn: -1 }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('mediaTrashItems');
  }
}
