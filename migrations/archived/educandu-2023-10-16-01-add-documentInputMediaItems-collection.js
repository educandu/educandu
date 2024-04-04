export default class Educandu_2023_10_16_01_add_documentInputMediaItems_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentInputMediaItems');
    await this.db.collection('documentInputMediaItems').createIndexes([
      {
        name: '_idx_roomId_',
        key: { roomId: 1 }
      },
      {
        name: '_idx_documentInputId_',
        key: { documentInputId: 1 }
      },
      {
        name: '_idx_url_',
        key: { url: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentInputMediaItems');
  }
}
