import httpErrors from 'http-errors';
import { createSandbox } from 'sinon';
import Database from '../stores/database.js';
import BatchService from './batch-service.js';
import TaskStore from '../stores/task-store.js';
import { BATCH_TYPE, TASK_TYPE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

const { BadRequest } = httpErrors;

describe('batch-service', () => {
  const sandbox = createSandbox();
  const now = new Date();

  let db;
  let sut;
  let user;
  let container;
  let taskStore;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    taskStore = container.get(TaskStore);
    sut = container.get(BatchService);
    db = container.get(Database);

    user = await setupTestUser(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('createDocumentRegenerationBatch', () => {
    let testDocument;

    beforeEach(async () => {
      testDocument = await createTestDocument(container, user, {
        title: 'Title',
        description: 'Description',
        slug: 'my-doc',
        language: 'en',
        sections: [],
        tags: ['tag-1']
      });
    });

    describe('when a running batch already exists', () => {
      beforeEach(async () => {
        await sut.createDocumentRegenerationBatch(user);
      });

      it('should return null', async () => {
        await expect(() => sut.createDocumentRegenerationBatch(user)).rejects.toThrow(BadRequest);
      });
    });

    describe('when a new batch is created', () => {
      let batch = null;
      beforeEach(async () => {
        batch = await sut.createDocumentRegenerationBatch(user);
      });

      it('should create the new batch', () => {
        expect(batch).toEqual({
          _id: expect.stringMatching(/\w+/),
          createdBy: user._id,
          createdOn: now,
          completedOn: null,
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          errors: []
        });
      });

      it('should create the according tasks', async () => {
        const tasks = await taskStore.getTasksByBatchId(batch._id);
        expect(tasks).toEqual([
          {
            _id: expect.stringMatching(/\w+/),
            batchId: batch._id,
            taskType: TASK_TYPE.documentRegeneration,
            processed: false,
            attempts: [],
            taskParams: {
              documentId: testDocument._id
            }
          }
        ]);
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
    let documents;

    beforeEach(async () => {
      documents = [
        await createTestDocument(container, user, {
          _id: 'v5NSMktadhzquVUAEdzAKg',
          title: 'doc-1',
          slug: 'doc-1',
          language: 'en',
          sections: [],
          tags: ['tag-1']
        }),
        await createTestDocument(container, user, {
          _id: 'sueoX7WCUtSUHT9cWE6UMq',
          title: 'doc-2',
          slug: 'doc-2',
          language: 'en',
          sections: [],
          tags: ['tag-2']
        })
      ];

      await sut.createDocumentRegenerationBatch(user);
      await db.tasks.updateOne({ taskParams: { documentId: documents[0]._id } }, { $set: { processed: true } });
      result = await sut.getBatchesWithProgress(BATCH_TYPE.documentRegeneration);
    });

    it('should return the batch', () => {

      expect(result).toEqual([
        {
          _id: expect.stringMatching(/\w+/),
          createdBy: user._id,
          createdOn: expect.any(Date),
          completedOn: null,
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          errors: [],
          progress: 0.5
        }
      ]);
    });

    it('should add the correct progress', () => {
      expect(result[0].progress).toEqual(0.5);
    });
  });

  describe('getBatchDetails', () => {
    let result;
    let documents;
    let createdBatchId;

    beforeEach(async () => {
      documents = [
        await createTestDocument(container, user, {
          _id: 'v5NSMktadhzquVUAEdzAKg',
          title: 'doc-1',
          slug: 'doc-1',
          language: 'en',
          sections: [],
          tags: ['tag-1']
        }),
        await createTestDocument(container, user, {
          _id: 'sueoX7WCUtSUHT9cWE6UMq',
          title: 'doc-2',
          slug: 'doc-2',
          language: 'en',
          sections: [],
          tags: ['tag-2']
        })
      ];

      await sut.createDocumentRegenerationBatch(user);
      await db.tasks.updateOne({ 'taskParams.documentId': documents[0]._id }, { $set: { processed: true } });
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
        batchType: BATCH_TYPE.documentRegeneration,
        batchParams: {},
        errors: [],
        progress: 0.5,
        tasks: expect.arrayContaining([
          {
            _id: expect.stringMatching(/\w+/),
            attempts: [],
            batchId: createdBatchId,
            processed: true,
            taskParams: {
              documentId: documents[0]._id
            },
            taskType: 'document-regeneration'
          },
          {
            _id: expect.stringMatching(/\w+/),
            attempts: [],
            batchId: createdBatchId,
            processed: false,
            taskParams: {
              documentId: documents[1]._id
            },
            taskType: 'document-regeneration'
          }
        ])
      });
    });

    it('should calculate the right progress', () => {
      expect(result.progress).toEqual(0.5);
    });
  });
});
