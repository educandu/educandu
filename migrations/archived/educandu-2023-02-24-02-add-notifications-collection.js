export default class Educandu_2023_02_24_02_add_notifications_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('notifications');
    await this.db.collection('notifications').createIndexes([
      {
        name: '_idx_notifiedUserId_readOn_',
        key: { notifiedUserId: 1, readOn: 1 },
        partialFilterExpression: { readOn: null }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('notifications');
  }
}
