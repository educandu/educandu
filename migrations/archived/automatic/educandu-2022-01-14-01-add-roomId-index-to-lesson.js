export default class Educandu_2022_01_14_01_add_roomId_index_to_lesson {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('lessons').createIndexes([
      {
        name: '_idx_roomId_',
        key: { roomId: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('lessons').dropIndex('_idx_roomId_');
  }
}
