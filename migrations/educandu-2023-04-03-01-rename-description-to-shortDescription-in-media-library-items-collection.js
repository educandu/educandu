export default class Educandu_2023_04_03_01_rename_description_to_shortDescription_in_media_library_items_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('mediaLibraryItems').updateMany({}, { $rename: { description: 'shortDescription' } });
  }

  async down() {
    await this.db.collection('mediaLibraryItems').updateMany({}, { $rename: { shortDescription: 'description' } });
  }
}
