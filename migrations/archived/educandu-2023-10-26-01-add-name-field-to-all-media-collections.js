export default class Educandu_2023_10_26_01_add_name_field_to_all_media_collections {
  constructor(db) {
    this.db = db;
  }

  async addNameFieldToCollection(collection) {
    await collection.updateMany({}, [
      { $set: { name: { $regexFind: { input: '$url', regex: '[^/]+$' } } } },
      { $set: { name: '$name.match' } }
    ]);
  }

  async removeNameFieldFromCollection(collection) {
    await collection.updateMany({}, [{ $unset: ['name'] }]);
  }

  async up() {
    await this.addNameFieldToCollection(this.db.collection('roomMediaItems'));
    await this.addNameFieldToCollection(this.db.collection('mediaLibraryItems'));
    await this.addNameFieldToCollection(this.db.collection('documentInputMediaItems'));

    await this.db.collection('mediaLibraryItems').dropIndex('_idx_resourceType_tags_');
    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_resourceType_name_tags_',
        key: { resourceType: 1, name: 1, tags: 1 }
      }
    ]);
  }

  async down() {
    await this.removeNameFieldFromCollection(this.db.collection('roomMediaItems'));
    await this.removeNameFieldFromCollection(this.db.collection('mediaLibraryItems'));
    await this.removeNameFieldFromCollection(this.db.collection('documentInputMediaItems'));

    await this.db.collection('mediaLibraryItems').dropIndex('_idx_resourceType_name_tags_');
    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_resourceType_tags_',
        key: { resourceType: 1, tags: 1 }
      }
    ]);
  }
}
