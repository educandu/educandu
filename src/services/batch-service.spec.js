import sinon from 'sinon';
import httpErrors from 'http-errors';
import Database from '../stores/database.js';
import BatchService from './batch-service.js';
import LockStore from '../stores/lock-store.js';
import TaskStore from '../stores/task-store.js';
import { BATCH_TYPE, TASK_TYPE } from '../domain/constants.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

const { BadRequest } = httpErrors;

describe('batch-service', () => {
  const sandbox = sinon.createSandbox();

  let db;
  let sut;
  let user;
  let container;
  let taskStore;
  let importSource;
  let documentsToImport;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    taskStore = container.get(TaskStore);
    sut = container.get(BatchService);
    db = container.get(Database);

    user = await setupTestUser(container);
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

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
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
      let lockStore;

      beforeEach(async () => {
        lockStore = container.get(LockStore);
        lock = await lockStore.takeBatchLock(importSource.hostName);
      });

      afterEach(async () => {
        await lockStore.releaseLock(lock);
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
    beforeEach(() => {
      sandbox.stub(taskStore, 'countTasksWithBatchIdGroupedByProcessedStatus');
    });

    describe('when the batch is completed', () => {
      it('should return 1', async () => {
        const result = await sut._getProgressForBatch({ completedOn: new Date() });
        expect(result).toEqual(1);
      });
    });

    describe('when the total count is 0', () => {
      it('should return 1', async () => {
        taskStore.countTasksWithBatchIdGroupedByProcessedStatus.resolves([
          { _id: true, count: 0 },
          { _id: false, count: 0 }
        ]);

        const result = await sut._getProgressForBatch({ _id: '123' });
        expect(result).toEqual(1);
      });
    });

    describe('when the processed count matches the total count', () => {
      it('should return 1', async () => {
        taskStore.countTasksWithBatchIdGroupedByProcessedStatus.resolves([
          { _id: true, count: 15 },
          { _id: false, count: 0 }
        ]);

        const result = await sut._getProgressForBatch({ _id: '123' });
        expect(result).toEqual(1);
      });
    });

    describe('when the total count matches is half of the total count', () => {
      it('should return 0.5', async () => {
        taskStore.countTasksWithBatchIdGroupedByProcessedStatus.resolves([
          { _id: true, count: 15 },
          { _id: false, count: 15 }
        ]);

        const result = await sut._getProgressForBatch({ _id: '123' });
        expect(result).toEqual(0.5);
      });
    });
  });

  describe('getBatchesWithProgress', () => {
    let result;

    beforeEach(async () => {
      result = await sut.createImportBatch({ importSource, documentsToImport, user });
      result = await sut.createImportBatch({
        importSource: { ...importSource, hostName: 'source2' },
        documentsToImport,
        user
      });
      await db.tasks.updateOne({ 'taskParams.key': 'v5NSMktadhzquVUAEdzAKg' }, { $set: { processed: true } });
      result = await sut.getBatchesWithProgress(BATCH_TYPE.documentImport);
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

  describe('getBatchDetails', () => {
    let result;
    let createdBatchId;

    beforeEach(async () => {
      await sut.createImportBatch({ importSource, documentsToImport, user });
      await db.tasks.updateOne({ 'taskParams.key': 'v5NSMktadhzquVUAEdzAKg' }, { $set: { processed: true } });
      const dbEntries = await db.batches.find({}).toArray();
      createdBatchId = dbEntries[0]._id;
      result = await sut.getBatchDetails(createdBatchId);
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
