import Database from './database.js';

class TaskStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.tasks;
  }

  getTasksByBatchId(batchId, { session } = {}) {
    return this.collection.find({ batchId }, { session }).toArray();
  }

  getUnprocessedTaskById(taskId, { session } = {}) {
    return this.collection.findOne({ _id: taskId, processed: false }, { session });
  }

  async getRandomUnprocessedTaskWithBatchId(batchId) {
    const results = await this.collection.aggregate([
      { $match: { batchId, processed: false } },
      { $sample: { size: 1 } }
    ]).toArray();

    return results[0];
  }

  countTasksWithBatchIdGroupedByProcessedStatus(batchId) {
    return this.collection.aggregate([
      { $match: { batchId } },
      { $group: { _id: '$processed', count: { $sum: 1 } } }
    ]).toArray();
  }

  saveTask(task, { session } = {}) {
    return this.collection.replaceOne({ _id: task._id }, task, { session, upsert: true });
  }

  addTasks(tasks, { session } = {}) {
    return this.collection.insertMany(tasks, { session });
  }
}

export default TaskStore;
