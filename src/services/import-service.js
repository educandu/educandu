import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import BatchStore from '../stores/batch-store.js';
import DocumentStore from '../stores/document-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import ExportApiClient from '../api-clients/export-api-client.js';
import { BATCH_TYPE, DOCUMENT_IMPORT_TYPE, DOCUMENT_ORIGIN, TASK_TYPE } from '../domain/constants.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

const importedDocumentsProjection = {
  key: 1,
  revision: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1
};

const lastUpdatedFirst = [['updatedOn', -1]];

const CONCURRENT_BATCH_ERROR_MESSAGE = 'Cannot create a new batch while another batch for the same source is still active';

class ImportService {
  static get inject() {
    return [DocumentStore, ExportApiClient, TransactionRunner, BatchStore, TaskStore, LockStore, UserStore];
  }

  constructor(documentStore, exportApiClient, transactionRunner, batchStore, taskStore, lockStore, userStore) {
    this.documentStore = documentStore;
    this.exportApiClient = exportApiClient;
    this.transactionRunner = transactionRunner;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.userStore = userStore;
  }

  getAllImportedDocumentsMetadata(hostName) {
    const filter = { archived: false, origin: `${DOCUMENT_ORIGIN.external}/${hostName}` };
    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: importedDocumentsProjection });
  }

  async getAllImportableDocumentsMetadata(importSource) {
    const baseUrl = urls.getImportSourceBaseUrl(importSource);

    const exportApiClientResponse = await this.exportApiClient.getExports({ baseUrl, apiKey: importSource.apiKey });
    const exportableDocuments = exportApiClientResponse?.docs || [];
    const importedDocuments = await this.getAllImportedDocumentsMetadata(importSource.hostName);

    const importableDocuments = exportableDocuments
      .map(exportableDocument => {
        const importedDocument = importedDocuments.find(document => document.key === exportableDocument.key);

        let importType;

        if (importedDocument) {
          importType = importedDocument.revision === exportableDocument.revision
            ? DOCUMENT_IMPORT_TYPE.reimport
            : DOCUMENT_IMPORT_TYPE.update;
        } else {
          importType = DOCUMENT_IMPORT_TYPE.add;
        }

        return {
          key: exportableDocument.key,
          title: exportableDocument.title,
          slug: exportableDocument.slug,
          language: exportableDocument.language,
          updatedOn: exportableDocument.updatedOn,
          importedRevision: importedDocument?.revision || null,
          importableRevision: exportableDocument.revision,
          importType
        };
      })
      .filter(importableDocument => importableDocument);

    return importableDocuments;
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
      throw new BadRequest(CONCURRENT_BATCH_ERROR_MESSAGE);
    }

    try {
      const existingActiveBatch = await this.batchStore.findOne({
        'batchType': BATCH_TYPE.documentImport,
        'batchParams.hostName': importSource.hostName,
        'completedOn': null
      });

      if (existingActiveBatch) {
        throw new BadRequest(CONCURRENT_BATCH_ERROR_MESSAGE);
      }

      logger.info(`Creating new import batch for source '${importSource.name}' containing ${tasks.length} tasks`);
      await this.transactionRunner.run(async session => {
        await this.batchStore.insertOne(batch, { session });
        await this.taskStore.insertMany(tasks, { session });
      });

    } finally {
      await this.lockStore.releaseLock(lock);
    }

    return batch;
  }

  async _getProgressForBatch(batch) {
    if (batch.completedOn) {
      return 1;
    }

    const countGroups = await this.taskStore.toAggregateArray([
      {
        $match: {
          batchId: batch._id
        }
      }, {
        $group: {
          _id: '$processed',
          count: {
            $sum: 1
          }
        }
      }
    ]);

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

  async getImportBatches() {
    const batches = await this.batchStore.find({ batchType: BATCH_TYPE.documentImport });

    return Promise.all(batches.map(async batch => {
      const progress = await this._getProgressForBatch(batch);
      return {
        ...batch,
        progress
      };
    }));
  }

  async getImportBatchDetails(id) {
    const batch = await this.batchStore.findOne({ _id: id });
    if (!batch) {
      throw new NotFound('Batch not found');
    }

    const tasks = await this.taskStore.find({ batchId: id });
    const processedTasksCount = tasks.filter(task => task.processed).length;

    batch.tasks = tasks;
    batch.progress = batch.tasks.length === 0 ? 1 : processedTasksCount / tasks.length;
    return batch;
  }
}

export default ImportService;
