/* eslint-disable camelcase, no-console */
export default class Educandu_2022_10_24_02_delete_import_tasks_and_batches {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const { deletedCount: deletedBatchesCount } = await this.db.collection('batches').deleteMany({ batchType: 'document-import' });
    console.log(`Deleted ${deletedBatchesCount} batches of type 'document-import'`);

    const { deletedCount: deletedTasksCount } = await this.db.collection('tasks').deleteMany({ taskType: 'document-import' });
    console.log(`Deleted ${deletedTasksCount} tasks of type 'document-import'`);
  }

  down() {
    throw Error('Not supported');
  }
}
