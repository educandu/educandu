import sinon from 'sinon';
import TaskStore from '../stores/task-store.js';
import TaskProcessor from './task-processor.js';
import { TASK_TYPE } from '../common/constants.js';
import TaskLockStore from '../stores/task-lock-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DocumentImportTaskProcessor } from './document-import-task-processor.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('task-processor', () => {

  const now = new Date();
  const sandbox = sinon.createSandbox();

  let sut;
  let ctx;
  let container;
  let taskStore;
  let taskLockStore;
  let serverConfig;
  let documentImportTaskProcessor;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    taskStore = container.get(TaskStore);
    taskLockStore = container.get(TaskLockStore);
    serverConfig = container.get(ServerConfig);
    documentImportTaskProcessor = container.get(DocumentImportTaskProcessor);
    sut = container.get(TaskProcessor);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
    sandbox.stub(taskStore, 'findOne');
    sandbox.stub(taskStore, 'save');
    sandbox.stub(taskLockStore, 'takeLock');
    sandbox.stub(taskLockStore, 'releaseLock');
    sandbox.stub(documentImportTaskProcessor, 'process');
    sandbox.stub(serverConfig, 'taskProcessing').value({ maxAttempts: 2 });
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('process', () => {
    let nextTask;
    const lock = {};
    const taskId = '123';
    const batchParams = {};

    describe('when taking the lock fails', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        taskLockStore.takeLock.rejects('Lock already taken');

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should not call taskStore.findOne', () => {
        sinon.assert.notCalled(taskStore.findOne);
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.save', () => {
        sinon.assert.notCalled(taskStore.save);
      });

      it('should not call taskLockStore.releaseLock', () => {
        sinon.assert.notCalled(taskLockStore.releaseLock);
      });
    });

    describe('when task already processed', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        taskLockStore.takeLock.resolves(lock);
        taskStore.findOne.resolves(null);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should call taskStore.findOne', () => {
        sinon.assert.calledWith(taskStore.findOne, { _id: taskId, processed: false });
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.save', () => {
        sinon.assert.notCalled(taskStore.save);
      });

      it('should call taskLockStore.releaseLock', () => {
        sinon.assert.calledWith(taskLockStore.releaseLock, lock);
      });
    });

    describe('when corresponding task processor is not found', () => {
      let thrownError;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        nextTask = { _id: taskId, taskType: 'abc', attempts: [] };

        taskLockStore.takeLock.resolves(lock);
        taskStore.findOne.resolves(nextTask);

        try {
          await sut.process(taskId, batchParams, ctx);
        } catch (error) {
          thrownError = error;
        }
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should call taskStore.findOne', () => {
        sinon.assert.calledWith(taskStore.findOne, { _id: taskId, processed: false });
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.save', () => {
        sinon.assert.notCalled(taskStore.save);
      });

      it('should call taskLockStore.releaseLock', () => {
        sinon.assert.calledWith(taskLockStore.releaseLock, lock);
      });

      it('should throw an error', () => {
        expect(thrownError?.message).toBe('Task type abc is unknown');
      });
    });

    describe('when task processing fails for the first time (out of 2 maxAttempts)', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };

        nextTask = { _id: taskId, taskType: TASK_TYPE.importDocument, processed: false, attempts: [] };

        taskLockStore.takeLock.resolves(lock);
        taskStore.findOne.resolves(nextTask);
        documentImportTaskProcessor.process.rejects(new Error('Processing failure 1'));

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should call taskStore.findOne', () => {
        sinon.assert.calledWith(taskStore.findOne, { _id: taskId, processed: false });
      });

      it('should call documentImportTaskProcessor.process', () => {
        sinon.assert.calledWith(documentImportTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.save', () => {
        sinon.assert.calledWith(taskStore.save, {
          _id: taskId,
          taskType: TASK_TYPE.importDocument,
          processed: false,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: ['Processing failure 1']
            }
          ]
        });
      });

      it('should call taskLockStore.releaseLock', () => {
        sinon.assert.calledWith(taskLockStore.releaseLock, lock);
      });
    });

    describe('when task processing fails for the second time (out of 2 maxAttempts)', () => {
      let nextTick;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        nextTask = {
          _id: taskId,
          taskType: TASK_TYPE.importDocument,
          processed: false,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: ['Processing failure 1']
            }
          ]
        };
        nextTick = new Date(sandbox.clock.tick(1000));

        taskLockStore.takeLock.resolves(lock);
        taskStore.findOne.resolves(nextTask);
        documentImportTaskProcessor.process.rejects(new Error('Processing failure 2'));

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should call taskStore.findOne', () => {
        sinon.assert.calledWith(taskStore.findOne, { _id: taskId, processed: false });
      });

      it('should call documentImportTaskProcessor.process', () => {
        sinon.assert.calledWith(documentImportTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.save', () => {
        sinon.assert.calledWith(taskStore.save, {
          _id: taskId,
          taskType: TASK_TYPE.importDocument,
          processed: true,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: ['Processing failure 1']
            },
            {
              startedOn: nextTick,
              completedOn: nextTick,
              errors: ['Processing failure 2']
            }
          ]
        });
      });

      it('should call taskLockStore.releaseLock', () => {
        sinon.assert.calledWith(taskLockStore.releaseLock, lock);
      });
    });

    describe('when task processing succeeds', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        nextTask = {
          _id: taskId,
          taskType: TASK_TYPE.importDocument,
          processed: false,
          attempts: []
        };

        taskLockStore.takeLock.resolves(lock);
        taskStore.findOne.resolves(nextTask);
        documentImportTaskProcessor.process.resolves();

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should call taskStore.findOne', () => {
        sinon.assert.calledWith(taskStore.findOne, { _id: taskId, processed: false });
      });

      it('should call documentImportTaskProcessor.process', () => {
        sinon.assert.calledWith(documentImportTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.save', () => {
        sinon.assert.calledWith(taskStore.save, {
          _id: taskId,
          taskType: TASK_TYPE.importDocument,
          processed: true,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: []
            }
          ]
        });
      });

      it('should call taskLockStore.releaseLock', () => {
        sinon.assert.calledWith(taskLockStore.releaseLock, lock);
      });
    });

    describe('when cancellation is requested', () => {
      beforeEach(async () => {
        nextTask = { _id: taskId };
        ctx = { cancellationRequested: true };

        taskLockStore.takeLock.resolves(lock);
        taskStore.findOne.resolves(nextTask);
        documentImportTaskProcessor.process.resolves();

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call taskLockStore.takeLock', () => {
        sinon.assert.calledOnce(taskLockStore.takeLock);
      });

      it('should call taskStore.findOne', () => {
        sinon.assert.calledWith(taskStore.findOne, { _id: taskId, processed: false });
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.save', () => {
        sinon.assert.notCalled(taskStore.save);
      });

      it('should call taskLockStore.releaseLock', () => {
        sinon.assert.calledWith(taskLockStore.releaseLock, lock);
      });
    });
  });
});
