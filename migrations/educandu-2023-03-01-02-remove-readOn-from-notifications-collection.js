export default class Educandu_2023_03_01_02_remove_readOn_from_notifications_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('notifications').dropIndex('_idx_notifiedUserId_readOn_');
    await this.db.collection('notifications').createIndexes([
      {
        name: '_idx_notifiedUserId_',
        key: { notifiedUserId: 1 }
      }
    ]);
    await this.db.collection('notifications').updateMany({}, { $unset: { readOn: null } });
  }

  async down() {
    await this.db.collection('notifications').dropIndex('_idx_notifiedUserId_');
    await this.db.collection('notifications').createIndexes([
      {
        name: '_idx_notifiedUserId_readOn_',
        key: { notifiedUserId: 1, readOn: 1 },
        partialFilterExpression: { readOn: null }
      }
    ]);
    await this.db.collection('notifications').updateMany({}, { $set: { readOn: null } });
  }
}
