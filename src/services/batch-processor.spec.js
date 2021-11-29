import sinon from 'sinon';
import TaskStore from '../stores/task-store.js';
import TaskProcessor from './task-processor.js';
import BatchProcessor from './batch-processor.js';
import BatchStore from '../stores/batch-store.js';
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
    sandbox.useFakeTimers(now);
    container = await setupTestEnvironment();
    taskStore = container.get(TaskStore);
    batchStore = container.get(BatchStore);
    taskProcessor = container.get(TaskProcessor);
    sut = container.get(BatchProcessor);
  });

  beforeEach(() => {
    sandbox.stub(taskStore, 'findRandomOne');
    sandbox.stub(batchStore, 'findOne');
    sandbox.stub(batchStore, 'save');
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
        batchStore.findOne.resolves(null);

        result = await sut.process(ctx);
      });

      it('should call batchStore.findOne', () => {
        sinon.assert.calledWith(batchStore.findOne, { completedOn: null });
      });

      it('should not call taskStore.findRandomOne', () => {
        sinon.assert.notCalled(taskStore.findRandomOne);
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

      beforeEach(async () => {
        uncompletedBatch = {};
        ctx = { cancellationRequested: false };
        batchStore.findOne.resolves(uncompletedBatch);
        taskStore.findRandomOne.resolves(null);

        result = await sut.process(ctx);
      });

      it('should call taskStore.findRandomOne', () => {
        sinon.assert.calledWith(taskStore.findRandomOne, { processed: false });
      });

      it('should complete the batch', () => {
        uncompletedBatch.completedOn = now;
        sinon.assert.calledWith(batchStore.save, uncompletedBatch);
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
        uncompletedBatch = {};
        nextCandidateTask = { _id: '123' };
        ctx = { cancellationRequested: false };
        batchStore.findOne.resolves(uncompletedBatch);
        taskStore.findRandomOne.resolves(nextCandidateTask);

        result = await sut.process(ctx);
      });

      it('should call taskStore.findRandomOne', () => {
        sinon.assert.calledWith(taskStore.findRandomOne, { processed: false });
      });

      it('should not complete the batch', () => {
        sinon.assert.notCalled(batchStore.save);
      });

      it('should call taskProcessor.process', () => {
        sinon.assert.calledWith(taskProcessor.process, nextCandidateTask._id, ctx);
      });

      it('should return true', () => {
        expect(result).toBe(true);
      });
    });

    describe('when cancellation is requested', () => {
      let uncompletedBatch;
      let nextCandidateTask;

      beforeEach(async () => {
        uncompletedBatch = {};
        nextCandidateTask = { _id: '123' };
        ctx = { cancellationRequested: true };
        batchStore.findOne.resolves(uncompletedBatch);
        taskStore.findRandomOne.resolves(nextCandidateTask);

        result = await sut.process(ctx);
      });

      it('should not call taskStore.findRandomOne', () => {
        sinon.assert.notCalled(taskStore.findRandomOne);
      });

      it('should not complete the batch', () => {
        sinon.assert.notCalled(batchStore.save);
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
