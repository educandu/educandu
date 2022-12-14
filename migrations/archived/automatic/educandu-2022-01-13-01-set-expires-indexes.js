export default class Educandu_2022_01_13_01_set_expires_indexes {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('batchLocks').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await this.db.collection('documentLocks').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await this.db.collection('roomLocks').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.collection('batchLocks').dropIndex('_idx_expires_');
    await this.db.collection('documentLocks').dropIndex('_idx_expires_');
    await this.db.collection('roomLocks').dropIndex('_idx_expires_');
  }
}
