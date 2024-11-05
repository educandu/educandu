export default class Educandu_2024_11_05_01_add_contactRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('contactRequests');
    await this.db.collection('contactRequests').createIndexes([
      {
        name: '_idx_fromUserId_toUserId_',
        key: { requestedFrom: 1, requestedTo: 1 },
        unique: true
      },
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('contactRequests');
  }
}
