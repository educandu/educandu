export default class Educandu_2023_10_04_02_add_roomMediaItems_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('roomMediaItems');
    await this.db.collection('roomMediaItems').createIndexes([
      {
        name: '_idx_roomId_',
        key: { roomId: 1 }
      },
      {
        name: '_idx_url_',
        key: { url: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('roomMediaItems');
  }
}
