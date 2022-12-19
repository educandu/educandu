export default class Educandu_2021_11_24_01_create_task_processing_collections {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('batches');
    await this.db.createCollection('batchLocks');
    await this.db.createCollection('tasks');
    await this.db.createCollection('taskLocks');

    await this.db.collection('taskLocks').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('batches');
    await this.db.dropCollection('batchLocks');
    await this.db.dropCollection('tasks');
    await this.db.dropCollection('taskLocks');
  }
}
