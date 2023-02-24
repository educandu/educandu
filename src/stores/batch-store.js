import Database from './database.js';

class BatchStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.batches;
  }

  getBatchById(batchId, { session } = {}) {
    return this.collection.findOne({ _id: batchId }, { session });
  }

  getBatchesByType(batchType, { session } = {}) {
    return this.collection.find({ batchType }, { session }).toArray();
  }

  getUncompleteBatchByType(batchType, { session } = {}) {
    return this.collection.findOne({ batchType, completedOn: null }, { session });
  }

  getUncompletedBatchByTypeAndHost({ batchType, hostName }, { session } = {}) {
    return this.collection.findOne({ batchType, 'batchParams.hostName': hostName, 'completedOn': null }, { session });
  }

  getUncompletedBatch({ session } = {}) {
    return this.collection.findOne({ completedOn: null }, { session });
  }

  createBatch(batch, { session } = {}) {
    return this.collection.insertOne(batch, { session });
  }

  saveBatch(batch, { session } = {}) {
    return this.collection.replaceOne({ _id: batch._id }, batch, { session, upsert: true });
  }

  async getLastBatchByBatchType(batchType, { session } = {}) {
    const lastBatches = await this.collection.find({ batchType }, { session }).sort({ createdOn: -1 }).limit(1).toArray();
    return lastBatches[0] || null;
  }
}

export default BatchStore;
