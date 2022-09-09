import sinon from 'sinon';
import LockStore from '../stores/lock-store.js';
import TaskStore from '../stores/task-store.js';
import TaskProcessor from './task-processor.js';
import { serializeError } from 'serialize-error';
import { TASK_TYPE } from '../domain/constants.js';
import ServerConfig from '../bootstrap/server-config.js';
import DocumentImportTaskProcessor from './document-import-task-processor.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';
import DocumentValidationTaskProcessor from './document-validation-task-processor.js';

describe('task-processor', () => {

  const now = new Date();
  const sandbox = sinon.createSandbox();

  let sut;
  let ctx;
  let container;
  let taskStore;
  let lockStore;
  let serverConfig;
  let documentImportTaskProcessor;
  let documentValidationTaskProcessor;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    taskStore = container.get(TaskStore);
    lockStore = container.get(LockStore);
    serverConfig = container.get(ServerConfig);
    documentImportTaskProcessor = container.get(DocumentImportTaskProcessor);
    documentValidationTaskProcessor = container.get(DocumentValidationTaskProcessor);
    sut = container.get(TaskProcessor);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
    sandbox.stub(taskStore, 'getUnprocessedTaskById');
    sandbox.stub(taskStore, 'saveTask');
    sandbox.stub(lockStore, 'takeTaskLock');
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(documentImportTaskProcessor, 'process');
    sandbox.stub(documentValidationTaskProcessor, 'process');
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
        lockStore.takeTaskLock.rejects('Lock already taken');

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should not call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.notCalled(taskStore.getUnprocessedTaskById);
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        sinon.assert.notCalled(taskStore.saveTask);
      });

      it('should not call lockStore.releaseLock', () => {
        sinon.assert.notCalled(lockStore.releaseLock);
      });
    });

    describe('when task already processed', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(null);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        sinon.assert.notCalled(taskStore.saveTask);
      });

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when corresponding task processor is not found', () => {
      let thrownError;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        nextTask = { _id: taskId, taskType: 'abc', attempts: [] };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);

        try {
          await sut.process(taskId, batchParams, ctx);
        } catch (error) {
          thrownError = error;
        }
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        sinon.assert.notCalled(taskStore.saveTask);
      });

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });

      it('should throw an error', () => {
        expect(thrownError?.message).toBe('Task type abc is unknown');
      });
    });

    describe('when task processing fails with an irrecoverable error', () => {
      let expectedError;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };

        nextTask = { _id: taskId, taskType: TASK_TYPE.documentValidation, processed: false, attempts: [] };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        expectedError = new Error('Processing failure 1');
        expectedError.isIrrecoverable = true;
        documentValidationTaskProcessor.process.rejects(expectedError);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentValidationTaskProcessor.process', () => {
        sinon.assert.calledOnceWithExactly(documentValidationTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        sinon.assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentValidation,
          processed: true,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: [serializeError(expectedError)]
            }
          ]
        });
      });

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when task processing fails for the first time (out of 2 maxAttempts)', () => {
      let expectedError;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };

        nextTask = { _id: taskId, taskType: TASK_TYPE.documentImport, processed: false, attempts: [] };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        expectedError = new Error('Processing failure 1');
        documentImportTaskProcessor.process.rejects(expectedError);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentImportTaskProcessor.process', () => {
        sinon.assert.calledWith(documentImportTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        sinon.assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentImport,
          processed: false,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: [serializeError(expectedError)]
            }
          ]
        });
      });

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when task processing fails for the second time (out of 2 maxAttempts)', () => {
      let nextTick;
      let expectedErrors;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        expectedErrors = [new Error('Processing failure 1'), new Error('Processing failure 2')];

        nextTask = {
          _id: taskId,
          taskType: TASK_TYPE.documentImport,
          processed: false,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: [serializeError(expectedErrors[0])]
            }
          ]
        };
        nextTick = new Date(sandbox.clock.tick(1000));

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        documentImportTaskProcessor.process.rejects(expectedErrors[1]);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentImportTaskProcessor.process', () => {
        sinon.assert.calledWith(documentImportTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        sinon.assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentImport,
          processed: true,
          attempts: [
            {
              startedOn: now,
              completedOn: now,
              errors: [serializeError(expectedErrors[0])]
            },
            {
              startedOn: nextTick,
              completedOn: nextTick,
              errors: [serializeError(expectedErrors[1])]
            }
          ]
        });
      });

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when task processing succeeds', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        nextTask = {
          _id: taskId,
          taskType: TASK_TYPE.documentImport,
          processed: false,
          attempts: []
        };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        documentImportTaskProcessor.process.resolves();

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentImportTaskProcessor.process', () => {
        sinon.assert.calledWith(documentImportTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        sinon.assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentImport,
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

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when cancellation is requested', () => {
      beforeEach(async () => {
        nextTask = { _id: taskId };
        ctx = { cancellationRequested: true };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        documentImportTaskProcessor.process.resolves();

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        sinon.assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        sinon.assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should not call documentImportTaskProcessor.process', () => {
        sinon.assert.notCalled(documentImportTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        sinon.assert.notCalled(taskStore.saveTask);
      });

      it('should call lockStore.releaseLock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });
    });
  });
});
