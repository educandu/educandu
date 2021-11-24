import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import TaskStore from '../stores/task-store.js';
import BatchStore from '../stores/batch-store.js';
import ExportApiClient from './export-api-client.js';
import DocumentStore from '../stores/document-store.js';
import BatchLockStore from '../stores/batch-lock-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { BATCH_TYPE, DOCUMENT_IMPORT_TYPE, DOCUMENT_ORIGIN, TASK_TYPE } from '../common/constants.js';

const { BadRequest } = httpErrors;

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

class ImportService {
  static get inject() {
    return [DocumentStore, ExportApiClient, TransactionRunner, BatchStore, TaskStore, BatchLockStore];
  }

  constructor(documentStore, exportApiClient, transactionRunner, batchStore, taskStore, batchLockStore) {
    this.documentStore = documentStore;
    this.exportApiClient = exportApiClient;
    this.transactionRunner = transactionRunner;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.batchLockStore = batchLockStore;
  }

  getAllImportedDocumentsMetadata(importDomain) {
    const filter = { archived: false, origin: `${DOCUMENT_ORIGIN.external}/${importDomain}` };
    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: importedDocumentsProjection });
  }

  async getAllImportableDocumentsMetadata(importSource) {
    const { baseUrl, apiKey } = importSource;
    const importDomain = new URL(baseUrl).hostname;

    const exportApiClientResponse = await this.exportApiClient.getExports({ baseUrl, apiKey });
    const exportableDocuments = exportApiClientResponse?.docs || [];
    const importedDocuments = await this.getAllImportedDocumentsMetadata(importDomain);

    const importableDocuments = exportableDocuments
      .map(exportableDocument => {
        const importedDocument = importedDocuments.find(document => document.key === exportableDocument.key);

        if (importedDocument?.revision === exportableDocument.revision) {
          return null;
        }

        return {
          key: exportableDocument.key,
          title: exportableDocument.title,
          slug: exportableDocument.slug,
          language: exportableDocument.language,
          updatedOn: exportableDocument.updatedOn,
          importedRevision: importedDocument?.revision || null,
          importableRevision: exportableDocument.revision,
          importType: importedDocument ? DOCUMENT_IMPORT_TYPE.update : DOCUMENT_IMPORT_TYPE.add
        };
      })
      .filter(importableDocument => importableDocument);

    return importableDocuments;
  }

  async createImportBatch({ importSource, documentsToImport, user }) {
    const batch = {
      _id: uniqueId.create(),
      createdBy: user._id,
      createdOn: new Date(),
      completedOn: null,
      batchType: BATCH_TYPE.importDocuments,
      batchParams: {
        source: importSource.name
      },
      errors: []
    };

    const tasks = documentsToImport.map(doc => ({
      _id: uniqueId.create(),
      batchId: batch._id,
      taskType: TASK_TYPE.importDocument,
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
      lock = await this.batchLockStore.takeLock(importSource.name);
    } catch (error) {
      throw new BadRequest('Concurrent batch creation for the same source is not allowed');
    }

    try {
      const existingActiveBatch = await this.batchStore.findOne({
        'batchType': BATCH_TYPE.importDocuments,
        'batchParams.source': importSource.name,
        'completedOn': null
      });

      if (existingActiveBatch) {
        throw new BadRequest('Cannot create a new batch while another batch for the same source is still active');
      }

      logger.info('Creating new import batch for source %s containing %n tasks', importSource.name, tasks.length);
      await this.transactionRunner.run(async session => {
        await this.batchStore.insertOne(batch, { session });
        await this.taskStore.insertMany(tasks, { session });
      });

    } finally {
      await this.batchLockStore.releaseLock(lock);
    }

    return batch;
  }
}

export default ImportService;
