export default class Educandu_2024_11_21_01_correct_expires_index_on_contactRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('contactRequests').dropIndex('_idx_expires_');

    await this.db.collection('contactRequests').createIndexes([
      {
        name: '_idx_expiresOn_',
        key: { expiresOn: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.collection('contactRequests').dropIndex('_idx_expiresOn_');

    await this.db.collection('contactRequests').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }
}
