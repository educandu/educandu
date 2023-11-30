export default class Educandu_2023_11_30_05_clean_up_batches_and_tasks {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.dropCollection('batches');
    await this.db.dropCollection('tasks');

    await this.db.createCollection('batches');
    await this.db.createCollection('tasks');

    await this.db.collection('tasks').createIndexes([
      {
        name: '_idx_batch_id_',
        key: { batchId: 1 }
      },
      {
        name: '_idx_batch_id_processed_',
        key: { batchId: 1, processed: 1 }
      },
      {
        name: '_idx_task_id_processed_',
        key: { taskId: 1, processed: 1 }
      }
    ]);
  }

  down() {
    throw Error('Not supported');
  }
}
