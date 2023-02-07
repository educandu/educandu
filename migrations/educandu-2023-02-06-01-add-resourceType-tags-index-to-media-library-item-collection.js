export default class Educandu_2023_02_06_01_add_resourceType_tags_index_to_media_library_item_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_resourceType_tags_',
        key: { resourceType: 1, tags: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('mediaLibraryItems').dropIndex('_idx_resourceType_tags_');
  }
}
