import { BATCH_TYPE, TASK_TYPE } from '../../src/domain/constants.js';

// eslint-disable-next-line camelcase
export default class Educandu_2022_01_10_01_update_task_and_batch_type_for_imports {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('batches').updateMany({ batchType: 'import-documents' }, { $set: { batchType: BATCH_TYPE.documentImport } });
    await this.db.collection('tasks').updateMany({ taskType: 'import-document' }, { $set: { taskType: TASK_TYPE.documentImport } });
  }

  async down() {
    await this.db.collection('batches').updateMany({ batchType: BATCH_TYPE.documentImport }, { $set: { batchType: 'import-documents' } });
    await this.db.collection('tasks').updateMany({ taskType: TASK_TYPE.documentImport }, { $set: { taskType: 'import-document' } });
  }
}
