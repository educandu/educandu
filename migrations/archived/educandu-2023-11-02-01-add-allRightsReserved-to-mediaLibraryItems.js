export default class Educandu_2023_11_02_01_add_allRightsReserved_to_mediaLibraryItems {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collection) {
    await collection.updateMany({}, { $set: { allRightsReserved: false } });
  }

  async collectionDown(collection) {
    await collection.updateMany({}, { $unset: { allRightsReserved: null } });
  }

  async up() {
    await this.collectionUp(this.db.collection('mediaLibraryItems'));
  }

  async down() {
    await this.collectionDown(this.db.collection('mediaLibraryItems'));
  }
}
