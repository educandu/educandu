import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import BatchStore from '../stores/batch-store.js';
import DocumentStore from '../stores/document-store.js';
import { BATCH_TYPE, CDN_RESOURCES_CONSOLIDATION_TASK_TYPE, TASK_TYPE } from '../domain/constants.js';
import TransactionRunner from '../stores/transaction-runner.js';
import LessonStore from '../stores/lesson-store.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

const CONCURRENT_IMPORT_BATCH_ERROR_MESSAGE = 'Cannot create a new import batch while another import for the same source is still active';

class BatchService {
  static get inject() {
    return [TransactionRunner, BatchStore, TaskStore, LockStore, DocumentStore, LessonStore];
  }

  constructor(transactionRunner, batchStore, taskStore, lockStore, documentStore, lessonStore) {
    this.transactionRunner = transactionRunner;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.documentStore = documentStore;
    this.lessonStore = lessonStore;
  }

  async createImportBatch({ importSource, documentsToImport, user }) {
    const batchParams = { ...importSource };
    delete batchParams.apiKey;

    const batch = {
      _id: uniqueId.create(),
      createdBy: user._id,
      createdOn: new Date(),
      completedOn: null,
      batchType: BATCH_TYPE.documentImport,
      batchParams,
      errors: []
    };

    const tasks = documentsToImport.map(doc => ({
      _id: uniqueId.create(),
      batchId: batch._id,
      taskType: TASK_TYPE.documentImport,
      processed: false,
      attempts: [],
      taskParams: {
        key: doc.key,
        title: doc.title,
        slug: doc.slug,
        language: doc.language,
        updatedOn: new Date(doc.updatedOn),
        importedRevision: doc.importedRevision,
        importableRevision: doc.importableRevision,
        importType: doc.importType
      }
    }));

    let lock;
    try {
      lock = await this.lockStore.takeBatchLock(importSource.hostName);
    } catch (error) {
      throw new BadRequest(CONCURRENT_IMPORT_BATCH_ERROR_MESSAGE);
    }

    try {
      const existingActiveBatch = await this.batchStore.getUncompletedBatchByTypeAndHost({
        batchType: BATCH_TYPE.documentImport,
        hostName: importSource.hostName
      });

      if (existingActiveBatch) {
        throw new BadRequest(CONCURRENT_IMPORT_BATCH_ERROR_MESSAGE);
      }

      logger.info(`Creating new import batch for source '${importSource.name}' containing ${tasks.length} tasks`);
      await this.transactionRunner.run(async session => {
        await this.batchStore.createBatch(batch, { session });
        await this.taskStore.addTasks(tasks, { session });
      });

    } finally {
      await this.lockStore.releaseLock(lock);
    }

    return batch;
  }

  async createDocumentRegenerationBatch(user) {
    const existingActiveBatch = await this.batchStore.getUncompleteBatchByType(BATCH_TYPE.documentRegeneration);

    if (existingActiveBatch) {
      throw new BadRequest('Another document regeneration batch is already in progress');
    }

    const batch = {
      _id: uniqueId.create(),
      createdBy: user._id,
      createdOn: new Date(),
      completedOn: null,
      batchType: BATCH_TYPE.documentRegeneration,
      batchParams: {},
      errors: []
    };

    const allDocumentKeys = await this.documentStore.getAllDocumentKeys();
    const tasks = allDocumentKeys.map(key => ({
      _id: uniqueId.create(),
      batchId: batch._id,
      taskType: TASK_TYPE.documentRegeneration,
      processed: false,
      attempts: [],
      taskParams: {
        key
      }
    }));

    await this.transactionRunner.run(async session => {
      await this.batchStore.createBatch(batch, { session });
      await this.taskStore.addTasks(tasks, { session });
    });

    return batch;
  }

  async createCdnResourcesConsolidationBatch(user) {
    const existingActiveBatch = await this.batchStore.getUncompleteBatchByType(BATCH_TYPE.cdnResourcesConsolidation);

    if (existingActiveBatch) {
      throw new BadRequest('Another CDN resources consolidation batch is already in progress');
    }

    const batch = {
      _id: uniqueId.create(),
      createdBy: user._id,
      createdOn: new Date(),
      completedOn: null,
      batchType: BATCH_TYPE.cdnResourcesConsolidation,
      batchParams: {},
      errors: []
    };

    const [allDocumentKeys, allLessonIds] = await Promise.all([
      this.documentStore.getAllDocumentKeys(),
      this.lessonStore.getAllLessonIds()
    ]);

    const tasksParams = [
      ...allDocumentKeys.map(key => ({ type: CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.document, documentKey: key })),
      ...allLessonIds.map(id => ({ type: CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.lesson, lessonId: id }))
    ];

    const tasks = tasksParams.map(param => ({
      _id: uniqueId.create(),
      batchId: batch._id,
      taskType: TASK_TYPE.cdnResourcesConsolidation,
      processed: false,
      attempts: [],
      taskParams: param
    }));

    await this.transactionRunner.run(async session => {
      await this.batchStore.createBatch(batch, { session });
      await this.taskStore.addTasks(tasks, { session });
    });

    return batch;
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
}

export default BatchService;
