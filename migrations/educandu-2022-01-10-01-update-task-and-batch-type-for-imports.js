// eslint-disable-next-line camelcase
export default class Educandu_2022_01_10_01_update_task_and_batch_type_for_imports {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('batches').updateMany({ batchType: 'import-documents' }, { $set: { batchType: 'document-import' } });
    await this.db.collection('tasks').updateMany({ taskType: 'import-document' }, { $set: { taskType: 'document-import' } });
  }

  async down() {
    await this.db.collection('batches').updateMany({ batchType: 'document-import' }, { $set: { batchType: 'import-documents' } });
    await this.db.collection('tasks').updateMany({ taskType: 'document-import' }, { $set: { taskType: 'import-document' } });
  }
}
