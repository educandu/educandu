import sinon from 'sinon';
import httpErrors from 'http-errors';
import Database from '../stores/database.js';
import TaskStore from '../stores/task-store.js';
import ImportService from './import-service.js';
import DocumentStore from '../stores/document-store.js';
import BatchLockStore from '../stores/batch-lock-store.js';
import ExportApiClient from '../api-clients/export-api-client.js';
import { BATCH_TYPE, DOCUMENT_ORIGIN, TASK_TYPE } from '../domain/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

const { BadRequest } = httpErrors;

describe('import-service', () => {

  const sandbox = sinon.createSandbox();

  let container;
  let user;
  let taskStore;
  let sut;
  let db;
  let importSource;
  let documentsToImport;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
    taskStore = container.get(TaskStore);
    sut = container.get(ImportService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  beforeEach(() => {
    importSource = {
      name: 'source-1',
      hostName: 'source1.com',
      allowUnsecure: false,
      apiKey: 'DFGRDB553dscfVDSv'
    };
    documentsToImport = [
      {
        key: 'v5NSMktadhzquVUAEdzAKg',
        title: 'doc-1',
        slug: 'doc-1',
        language: 'en',
        updatedOn: '2021-11-24T16:00:32.200Z',
        importedRevision: null,
        importableRevision: 'gvxaYSFamGGfeWTYPrA6q9',
        importType: 'add'
      },
      {
        key: 'sueoX7WCUtSUHT9cWE6UMq',
        title: 'doc-2',
        slug: 'doc-2',
        language: 'en',
        updatedOn: '2021-11-24T16:05:27.800Z',
        importedRevision: 'wtwS9CJndhKkdFrCHFEifM',
        importableRevision: '6AXHKzH3z26r7JKJyPN6er',
        importType: 'update'
      }
    ];
  });
  describe('getAllImportedDocumentsMetadata', () => {
    let result;

    describe('with \'website.com\' import domain', () => {
      const testDocs = [
        { title: 'doc-1', archived: false, origin: DOCUMENT_ORIGIN.internal },
        { title: 'doc-2', archived: true, origin: DOCUMENT_ORIGIN.internal },
        { title: 'doc-3', archived: false, origin: `${DOCUMENT_ORIGIN.external}/website.com` },
        { title: 'doc-4', archived: true, origin: `${DOCUMENT_ORIGIN.external}/website.com` },
        { title: 'doc-5', archived: false, origin: `${DOCUMENT_ORIGIN.external}/website.de` }
      ];

      beforeEach(async () => {
        for (const testDoc of testDocs) {
          // eslint-disable-next-line no-await-in-loop
          await createTestDocument(container, user, testDoc);
        }
        result = await sut.getAllImportedDocumentsMetadata('website.com');
      });

      it('should not return unarchived documents with origin \'internal\'', () => {
        expect(result.find(doc => doc.title === 'doc-1')).toBeUndefined();
      });

      it('should not return archived documents with origin \'internal\'', () => {
        expect(result.find(doc => doc.title === 'doc-2')).toBeUndefined();
      });

      it('should return unarchived documents with origin \'external/website.com\'', () => {
        expect(result.find(doc => doc.title === 'doc-3')).toBeDefined();
      });

      it('should not return archived documents with origin \'external/website.com\'', () => {
        expect(result.find(doc => doc.title === 'doc-4')).toBeUndefined();
      });

      it('should not return unarchived documents with origin \'external/website.de\'', () => {
        expect(result.find(doc => doc.title === 'doc-5')).toBeUndefined();
      });
    });

  });

  describe('getAllImportableDocumentsMetadata', () => {
    let documentStore;
    let exportApiClient;
    let result;

    beforeEach(() => {
      exportApiClient = container.get(ExportApiClient);
      sandbox.stub(exportApiClient, 'getExports');
      documentStore = container.get(DocumentStore);
      sandbox.stub(documentStore, 'find');
      importSource = {
        name: 'Other System',
        hostName: 'other-system.com',
        allowUnsecure: true,
        apiKey: 'FSDdsh35nADh44nADCD8'
      };
    });

    describe('on every call', () => {
      beforeEach(async () => {
        exportApiClient.getExports.resolves({ docs: [] });
        documentStore.find.resolves([]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should call exportApiClient.getExports', () => {
        sinon.assert.calledWith(exportApiClient.getExports, { baseUrl: 'http://other-system.com', apiKey: 'FSDdsh35nADh44nADCD8' });
      });

      it('should call documentStore.find', () => {
        sinon.assert.calledWith(documentStore.find, {
          archived: false,
          origin: 'external/other-system.com'
        }, {
          sort: [['updatedOn', -1]],
          projection: { key: 1, revision: 1, updatedOn: 1, title: 1, slug: 1, language: 1 }
        });
      });
    });

    describe('when there are no exportable and no already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([]);
        exportApiClient.getExports.resolves({ docs: [] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([{ key: 'key', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]);
        exportApiClient.getExports.resolves({ docs: [] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only exportable documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([]);
        exportApiClient.getExports.resolves({
          docs: [{ key: 'key', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]
        });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an array of documents that can be freshly imported (added)', () => {
        expect(result).toEqual([{ key: 'key', importedRevision: null, importableRevision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language', importType: 'add' }]);
      });
    });

    describe('when there are both exportable and already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([
          { key: 'key1', revision: 'revision1a', updatedOn: 'updatedOn1a', title: 'title1a', slug: 'slug1a', language: 'language1a' },
          { key: 'key2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { key: 'key3', revision: 'revision3a', updatedOn: 'updatedOn3a', title: 'title3a', slug: 'slug3a', language: 'language3a' }
        ]);
        exportApiClient.getExports.resolves({ docs: [
          { key: 'key1', revision: 'revision1b', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b' },
          { key: 'key2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { key: 'key4', revision: 'revision4a', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a' }
        ] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return the array of importable documents', () => {
        expect(result).toEqual([
          { key: 'key1', importedRevision: 'revision1a', importableRevision: 'revision1b', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b', importType: 'update' },
          { key: 'key2', importedRevision: 'revision2a', importableRevision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a', importType: 'reimport' },
          { key: 'key4', importedRevision: null, importableRevision: 'revision4a', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a', importType: 'add' }
        ]);
      });
    });
  });

  describe('createImportBatch', () => {
    describe('when creating a new batch', () => {
      let result;
      beforeEach(async () => {
        result = await sut.createImportBatch({ importSource, documentsToImport, user });
      });

      it('creates a new batch in the database', async () => {
        const dbEntries = await db.batches.find({}).toArray();
        expect(dbEntries).toEqual([
          {
            _id: expect.stringMatching(/\w+/),
            createdBy: user._id,
            createdOn: expect.any(Date),
            completedOn: null,
            batchType: BATCH_TYPE.documentImport,
            batchParams: {
              name: 'source-1',
              hostName: 'source1.com',
              allowUnsecure: false
            },
            errors: []
          }
        ]);
      });

      it('creates all tasks of the new batch in the database', async () => {
        const dbEntries = await db.tasks.find({}).toArray();
        expect(dbEntries).toEqual([
          {
            _id: expect.stringMatching(/\w+/),
            batchId: expect.stringMatching(/\w+/),
            taskType: TASK_TYPE.documentImport,
            processed: false,
            attempts: [],
            taskParams: {
              ...documentsToImport[0],
              updatedOn: new Date(documentsToImport[0].updatedOn)
            }
          },
          {
            _id: expect.stringMatching(/\w+/),
            batchId: expect.stringMatching(/\w+/),
            taskType: TASK_TYPE.documentImport,
            processed: false,
            attempts: [],
            taskParams: {
              ...documentsToImport[1],
              updatedOn: new Date(documentsToImport[1].updatedOn)
            }
          }
        ]);
      });

      it('returns the created batch object', async () => {
        const dbEntries = await db.batches.find({}).toArray();
        expect(dbEntries).toEqual([result]);
      });

    });

    describe('when there is an existing lock for the same import source', () => {
      let lock;
      let batchLockStore;

      beforeEach(async () => {
        batchLockStore = container.get(BatchLockStore);
        lock = await batchLockStore.takeLock(importSource.hostName);
      });

      afterEach(async () => {
        await batchLockStore.releaseLock(lock);
      });

      it('should fail the concurrency check', async () => {
        await expect(() => sut.createImportBatch({ importSource, documentsToImport, user }))
          .rejects
          .toThrowError(BadRequest);
      });
    });

    describe('when there is an existing batch that is not yet completely processed', () => {
      beforeEach(async () => {
        await sut.createImportBatch({ importSource, documentsToImport, user });
      });

      it('should fail the unique check', async () => {
        await expect(() => sut.createImportBatch({ importSource, documentsToImport, user }))
          .rejects
          .toThrowError(BadRequest);
      });
    });

  });

  describe('_getProgressForBatch', () => {
    describe('when the batch is completed', () => {
      it('should return 1', async () => {
        const result = await sut._getProgressForBatch({ completedOn: new Date() });
        expect(result).toEqual(1);
      });
    });

    describe('when the total count is 0', () => {
      it('should return 1', async () => {
        sandbox.stub(taskStore, 'toAggregateArray').resolves([
          { _id: true, count: 0 },
          { id: false, count: 0 }
        ]);

        const result = await sut._getProgressForBatch({ _id: '123' });
        expect(result).toEqual(1);
      });
    });

    describe('when the processed count matches the total count', () => {
      it('should return 1', async () => {
        sandbox.stub(taskStore, 'toAggregateArray').resolves([
          { _id: true, count: 15 },
          { id: false, count: 0 }
        ]);

        const result = await sut._getProgressForBatch({ _id: '123' });
        expect(result).toEqual(1);
      });
    });

    describe('when the total count matches is half of the total count', () => {
      it('should return 0.5', async () => {
        sandbox.stub(taskStore, 'toAggregateArray').resolves([
          { _id: true, count: 15 },
          { id: false, count: 15 }
        ]);

        const result = await sut._getProgressForBatch({ _id: '123' });
        expect(result).toEqual(0.5);
      });
    });
  });

  describe('getImportBatches', () => {
    let result;

    beforeEach(async () => {
      result = await sut.createImportBatch({ importSource, documentsToImport, user });
      result = await sut.createImportBatch({
        importSource: { ...importSource, hostName: 'source2' },
        documentsToImport,
        user
      });
      await taskStore.updateOne({ 'taskParams.key': 'v5NSMktadhzquVUAEdzAKg' }, { $set: { processed: true } });
      result = await sut.getImportBatches();
    });

    it('should return the batch', () => {

      expect(result).toEqual([
        {
          _id: expect.stringMatching(/\w+/),
          createdBy: user._id,
          createdOn: expect.any(Date),
          completedOn: null,
          batchType: BATCH_TYPE.documentImport,
          batchParams: {
            name: 'source-1',
            hostName: 'source1.com',
            allowUnsecure: false
          },
          errors: [],
          progress: 0.5
        },
        {
          _id: expect.stringMatching(/\w+/),
          createdBy: user._id,
          createdOn: expect.any(Date),
          completedOn: null,
          batchType: BATCH_TYPE.documentImport,
          batchParams: {
            name: 'source-1',
            hostName: 'source2',
            allowUnsecure: false
          },
          errors: [],
          progress: 0
        }
      ]);
    });

    it('should add the correct progress', () => {
      expect(result[0].progress).toEqual(0.5);
      expect(result[1].progress).toEqual(0);
    });
  });

  describe('getImportBatchDetails', () => {
    let result;
    let createdBatchId;

    beforeEach(async () => {
      await sut.createImportBatch({ importSource, documentsToImport, user });
      await taskStore.updateOne({ 'taskParams.key': 'v5NSMktadhzquVUAEdzAKg' }, { $set: { processed: true } });
      const dbEntries = await db.batches.find({}).toArray();
      createdBatchId = dbEntries[0]._id;
      result = await sut.getImportBatchDetails(createdBatchId);
    });

    it('should return the batch', () => {
      expect(result).toEqual({
        _id: createdBatchId,
        createdBy: user._id,
        createdOn: expect.any(Date),
        completedOn: null,
        batchType: BATCH_TYPE.documentImport,
        batchParams: {
          name: 'source-1',
          hostName: 'source1.com',
          allowUnsecure: false
        },
        errors: [],
        progress: 0.5,
        tasks: expect.arrayContaining([
          {
            _id: expect.stringMatching(/\w+/),
            attempts: [],
            batchId: createdBatchId,
            processed: true,
            taskParams: {
              importType: 'add',
              importableRevision: 'gvxaYSFamGGfeWTYPrA6q9',
              importedRevision: null,
              key: documentsToImport[0].key,
              language: 'en',
              slug: 'doc-1',
              title: 'doc-1',
              updatedOn: expect.any(Date)
            },
            taskType: 'document-import'
          },
          {
            _id: expect.stringMatching(/\w+/),
            attempts: [],
            batchId: createdBatchId,
            processed: false,
            taskParams: {
              importType: 'update',
              importableRevision: '6AXHKzH3z26r7JKJyPN6er',
              importedRevision: 'wtwS9CJndhKkdFrCHFEifM',
              key: documentsToImport[1].key,
              language: 'en',
              slug: 'doc-2',
              title: 'doc-2',
              updatedOn: expect.any(Date)
            },
            taskType: 'document-import'
          }
        ])
      });
    });

    it('should calculate the right progress', () => {
      expect(result.progress).toEqual(0.5);
    });
  });
});
