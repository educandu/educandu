import httpErrors from 'http-errors';
import uniqueId from '../utils/unique-id.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import RoomStore from '../stores/room-store.js';
import BatchStore from '../stores/batch-store.js';
import DocumentStore from '../stores/document-store.js';
import { BATCH_TYPE, TASK_TYPE } from '../domain/constants.js';
import TransactionRunner from '../stores/transaction-runner.js';

const { BadRequest, NotFound } = httpErrors;

const mapBatchTypeToTaskType = batchType => {
  return {
    [BATCH_TYPE.documentRegeneration]: TASK_TYPE.documentRegeneration,
    [BATCH_TYPE.documentValidation]: TASK_TYPE.documentValidation,
    [BATCH_TYPE.cdnResourcesConsolidation]: TASK_TYPE.cdnResourcesConsolidation
  }[batchType] || null;
};

class BatchService {
  static dependencies = [TransactionRunner, BatchStore, TaskStore, LockStore, DocumentStore, RoomStore];

  constructor(transactionRunner, batchStore, taskStore, lockStore, documentStore, roomStore) {
    this.transactionRunner = transactionRunner;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.documentStore = documentStore;
    this.roomStore = roomStore;
  }

  async createBatch({ batchType, user }) {
    const taskType = mapBatchTypeToTaskType(batchType);
    if (!taskType) {
      throw new BadRequest(`Invalid batch type: '${batchType}'`);
    }

    const existingActiveBatch = await this.batchStore.getUncompleteBatchByType(batchType);
    if (existingActiveBatch) {
      throw new BadRequest(`Another batch with type '${batchType}' is already in progress`);
    }

    const taskParams = await this._createTaskParams(taskType);

    const batch = this._createBatchObject(user._id, batchType);
    const tasks = taskParams.map(params => this._createTaskObject(batch._id, taskType, params));

    await this.transactionRunner.run(async session => {
      await this.batchStore.createBatch(batch, { session });
      await this.taskStore.addTasks(tasks, { session });
    });

    return batch;
  }

  _createBatchObject(userId, batchType, batchParams = {}) {
    return {
      _id: uniqueId.create(),
      createdBy: userId,
      createdOn: new Date(),
      completedOn: null,
      batchType,
      batchParams,
      errors: []
    };
  }

  _createTaskObject(batchId, taskType, taskParams) {
    return {
      _id: uniqueId.create(),
      batchId,
      taskType,
      processed: false,
      attempts: [],
      taskParams
    };
  }

  _createTaskParams(taskType) {
    switch (taskType) {
      case TASK_TYPE.documentRegeneration:
      case TASK_TYPE.documentValidation:
      case TASK_TYPE.cdnResourcesConsolidation:
        return this.documentStore.getAllDocumentIds().then(allDocumentIds => {
          return allDocumentIds.map(documentId => ({ documentId }));
        });
      default:
        throw new BadRequest(`Invalid task type: '${taskType}'`);
    }
  }

  async _getProgressForBatch(batch) {
    if (batch.completedOn) {
      return 1;
    }

    const countGroups = await this.taskStore.countTasksWithBatchIdGroupedByProcessedStatus(batch._id);

    const stats = countGroups.reduce((accumulator, current) => {
      accumulator.totalCount += current.count;
      const isProcessedGroup = current._id === true;

      if (isProcessedGroup) {
        accumulator.processedCount += current.count;
      }
      return accumulator;
    }, { totalCount: 0, processedCount: 0 });

    return stats.totalCount === 0 ? 1 : stats.processedCount / stats.totalCount;
  }

  async getBatchesWithProgress(batchType) {
    const batches = await this.batchStore.getBatchesByType(batchType);

    return Promise.all(batches.map(async batch => {
      const progress = await this._getProgressForBatch(batch);
      return {
        ...batch,
        progress
      };
    }));
  }

  async getBatchDetails(id) {
    const batch = await this.batchStore.getBatchById(id);
    if (!batch) {
      throw new NotFound('Batch not found');
    }

    const tasks = await this.taskStore.getTasksByBatchId(id);
    const processedTasksCount = tasks.filter(task => task.processed).length;

    batch.tasks = tasks;
    batch.progress = batch.tasks.length === 0 ? 1 : processedTasksCount / tasks.length;
    return batch;
  }

  getLastBatch(batchType) {
    return this.batchStore.getLastBatchByBatchType(batchType);
  }
}

export default BatchService;
