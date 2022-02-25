import Database from './database.js';

class BatchStore {
  static get inject() { return [Database]; }

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

  addBatch(batch, { session } = {}) {
    return this.collection.insertOne(batch, { session });
  }

  saveBatch(batch, { session } = {}) {
    return this.collection.replaceOne({ _id: batch._id }, batch, { session, upsert: true });
  }
}

export default BatchStore;
