import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import RoomStore from '../stores/room-store.js';
import BatchStore from '../stores/batch-store.js';
import LessonStore from '../stores/lesson-store.js';
import DocumentStore from '../stores/document-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { BATCH_TYPE, CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE, TASK_TYPE } from '../domain/constants.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

const CONCURRENT_IMPORT_BATCH_ERROR_MESSAGE = 'Cannot create a new import batch while another import for the same source is still active';

class BatchService {
  static get inject() {
    return [TransactionRunner, BatchStore, TaskStore, LockStore, DocumentStore, LessonStore, RoomStore];
  }

  constructor(transactionRunner, batchStore, taskStore, lockStore, documentStore, lessonStore, roomStore) {
    this.transactionRunner = transactionRunner;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.documentStore = documentStore;
    this.lessonStore = lessonStore;
    this.roomStore = roomStore;
  }

  async createImportBatch({ importSource, documentsToImport, user }) {
    const batchParams = { ...importSource };
    delete batchParams.apiKey;

    const batch = this._createBatchObject(user._id, BATCH_TYPE.documentImport, batchParams);

    const tasks = documentsToImport.map(doc => this._createTaskObject(batch._id, TASK_TYPE.documentImport, {
      documentId: doc._id,
      title: doc.title,
      slug: doc.slug,
      language: doc.language,
      updatedOn: new Date(doc.updatedOn),
      importedRevision: doc.importedRevision,
      importableRevision: doc.importableRevision,
      importType: doc.importType
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

    const batch = this._createBatchObject(user._id, BATCH_TYPE.documentRegeneration);

    const allDocumentIds = await this.documentStore.getAllDocumentIds();

    const tasks = allDocumentIds.map(documentId => this._createTaskObject(batch._id, TASK_TYPE.documentRegeneration, { documentId }));

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

    const batch = this._createBatchObject(user._id, BATCH_TYPE.cdnResourcesConsolidation);

    const allDocumentIds = await this.documentStore.getAllDocumentIds();
    const tasksParams = allDocumentIds.map(documentId => ({ documentId }));

    const tasks = tasksParams.map(param => this._createTaskObject(batch._id, TASK_TYPE.cdnResourcesConsolidation, param));

    await this.transactionRunner.run(async session => {
      await this.batchStore.createBatch(batch, { session });
      await this.taskStore.addTasks(tasks, { session });
    });

    return batch;
  }

  async createCdnUploadDirectoryCreationBatch(user) {
    const existingActiveBatch = await this.batchStore.getUncompleteBatchByType(BATCH_TYPE.cdnUploadDirectoryCreation);

    if (existingActiveBatch) {
      throw new BadRequest('Another CDN upload directory creation batch is already in progress');
    }

    const batch = this._createBatchObject(user._id, BATCH_TYPE.cdnUploadDirectoryCreation);

    const [allDocumentIds, allRoomIds] = await Promise.all([
      this.documentStore.getAllDocumentIds(),
      this.roomStore.getAllPrivateRoomIds()
    ]);

    const tasksParams = [
      ...allDocumentIds.map(documentId => ({ type: CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document, documentId })),
      ...allRoomIds.map(id => ({ type: CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.room, roomId: id }))
    ];

    const tasks = tasksParams.map(param => this._createTaskObject(batch._id, TASK_TYPE.cdnUploadDirectoryCreation, param));

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
