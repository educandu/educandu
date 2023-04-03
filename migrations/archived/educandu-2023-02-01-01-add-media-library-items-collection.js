export default class Educandu_2023_02_01_01_add_media_library_items_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('mediaLibraryItems');
    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_resourceType_',
        key: { resourceType: 1 }
      },
      {
        name: '_idx_licenses_',
        key: { licenses: 1 }
      },
      {
        name: '_idx_tags_',
        key: { tags: 1 }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('mediaLibraryItems');
  }
}
