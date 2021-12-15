export default {
  name: 'tasks',
  indexes: [
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
  ]
};
