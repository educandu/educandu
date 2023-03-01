export default class Educandu_2023_03_01_01_add_expiresOn_to_notifications_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.dropCollection('notifications');
    await this.db.createCollection('notifications');
    await this.db.collection('notifications').createIndexes([
      {
        name: '_idx_notifiedUserId_readOn_',
        key: { notifiedUserId: 1, readOn: 1 },
        partialFilterExpression: { readOn: null }
      },
      {
        name: '_idx_expiresOn_',
        key: { expiresOn: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('notifications');
    await this.db.createCollection('notifications');
    await this.db.collection('notifications').createIndexes([
      {
        name: '_idx_notifiedUserId_readOn_',
        key: { notifiedUserId: 1, readOn: 1 },
        partialFilterExpression: { readOn: null }
      }
    ]);
  }
}
