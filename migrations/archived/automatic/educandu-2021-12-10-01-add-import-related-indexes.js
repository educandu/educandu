// eslint-disable-next-line camelcase
export default class Educandu_2021_12_10_01_add_import_related_indexes {
  constructor(db) {
    this.db = db;
  }

  async up() {
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

  async down() {
    await this.db.collection('tasks').dropIndex('_idx_batch_id_');
    await this.db.collection('tasks').dropIndex('_idx_batch_id_processed_');
    await this.db.collection('tasks').dropIndex('_idx_task_id_processed_');
  }
}
