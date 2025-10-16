export default class Educandu_2025_10_16_01_correct_indexes_on_contactRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('contactRequests').dropIndexes();

    await this.db.collection('contactRequests').createIndexes([
      {
        name: '_idx_fromUserId_toUserId_',
        key: { fromUserId: 1, toUserId: 1 },
        unique: true
      },
      {
        name: '_idx_expiresOn_',
        key: { expiresOn: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  down() {
    throw new Error('Not supported');
  }
}
