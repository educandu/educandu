import sinon from 'sinon';
import TaskStore from '../stores/task-store.js';
import TaskProcessor from './task-processor.js';
import BatchProcessor from './batch-processor.js';
import BatchStore from '../stores/batch-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('batch-processor', () => {

  const now = new Date();
  const sandbox = sinon.createSandbox();

  let sut;
  let ctx;
  let result;
  let container;
  let taskStore;
  let batchStore;
  let taskProcessor;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    taskStore = container.get(TaskStore);
    batchStore = container.get(BatchStore);
    taskProcessor = container.get(TaskProcessor);
    sut = container.get(BatchProcessor);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
    sandbox.stub(taskStore, 'getRandomUnprocessedTaskWithBatchId');
    sandbox.stub(batchStore, 'getUncompletedBatch');
    sandbox.stub(batchStore, 'saveBatch');
    sandbox.stub(taskProcessor, 'process');
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('process', () => {
    describe('when there are no batches to process', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        batchStore.getUncompletedBatch.resolves(null);

        result = await sut.process(ctx);
      });

      it('should call batchStore.getUncompletedBatch', () => {
        sinon.assert.called(batchStore.getUncompletedBatch);
      });

      it('should not call taskStore.getRandomUnprocessedTaskWithBatchId', () => {
        sinon.assert.notCalled(taskStore.getRandomUnprocessedTaskWithBatchId);
      });

      it('should not call taskProcessor.process', () => {
        sinon.assert.notCalled(taskProcessor.process);
      });

      it('should return false', () => {
        expect(result).toBe(false);
      });
    });

    describe('when there are no tasks to process', () => {
      let uncompletedBatch;
      let expectedBatch;

      beforeEach(async () => {
        uncompletedBatch = { _id: 'batchId', batchParams: {} };
        expectedBatch = { ...uncompletedBatch, completedOn: now };
        ctx = { cancellationRequested: false };
        batchStore.getUncompletedBatch.resolves(uncompletedBatch);
        taskStore.getRandomUnprocessedTaskWithBatchId.resolves(null);

        result = await sut.process(ctx);
      });

      it('should call taskStore.getRandomUnprocessedTaskWithBatchId', () => {
        sinon.assert.calledWith(taskStore.getRandomUnprocessedTaskWithBatchId, 'batchId');
      });

      it('should complete the batch', () => {
        sinon.assert.calledWith(batchStore.saveBatch, expectedBatch);
      });

      it('should not call taskProcessor.process', () => {
        sinon.assert.notCalled(taskProcessor.process);
      });

      it('should return false', () => {
        expect(result).toBe(false);
      });
    });

    describe('when there are tasks to process', () => {
      let uncompletedBatch;
      let nextCandidateTask;

      beforeEach(async () => {
        uncompletedBatch = { _id: 'batchId', batchParams: {} };
        nextCandidateTask = { _id: 'taskId' };
        ctx = { cancellationRequested: false };
        batchStore.getUncompletedBatch.resolves(uncompletedBatch);
        taskStore.getRandomUnprocessedTaskWithBatchId.resolves(nextCandidateTask);

        result = await sut.process(ctx);
      });

      it('should call taskStore.getRandomUnprocessedTaskWithBatchId', () => {
        sinon.assert.calledWith(taskStore.getRandomUnprocessedTaskWithBatchId, 'batchId');
      });

      it('should not complete the batch', () => {
        sinon.assert.notCalled(batchStore.saveBatch);
      });

      it('should call taskProcessor.process', () => {
        sinon.assert.calledWith(taskProcessor.process, nextCandidateTask._id, uncompletedBatch.batchParams, ctx);
      });

      it('should return true', () => {
        expect(result).toBe(true);
      });
    });

    describe('when cancellation is requested', () => {
      let uncompletedBatch;
      let nextCandidateTask;

      beforeEach(async () => {
        uncompletedBatch = { batchParams: {} };
        nextCandidateTask = { _id: 'taskId' };
        ctx = { cancellationRequested: true };
        batchStore.getUncompletedBatch.resolves(uncompletedBatch);
        taskStore.getRandomUnprocessedTaskWithBatchId.resolves(nextCandidateTask);

        result = await sut.process(ctx);
      });

      it('should not call taskStore.getRandomUnprocessedTaskWithBatchId', () => {
        sinon.assert.notCalled(taskStore.getRandomUnprocessedTaskWithBatchId);
      });

      it('should not complete the batch', () => {
        sinon.assert.notCalled(batchStore.saveBatch);
      });

      it('should not call taskProcessor.process', () => {
        sinon.assert.notCalled(taskProcessor.process);
      });

      it('should return true', () => {
        expect(result).toBe(true);
      });
    });

  });
});
