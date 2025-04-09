export default class Educandu_2025_04_09_01_add_index_for_url_on_mediaLibraryItems_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_url_',
        key: { url: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.collection('mediaLibraryItems').dropIndex('_idx_url_');
  }
}
