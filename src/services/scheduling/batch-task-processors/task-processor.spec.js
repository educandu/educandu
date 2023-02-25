import { assert, createSandbox } from 'sinon';
import TaskProcessor from './task-processor.js';
import { serializeError } from 'serialize-error';
import LockStore from '../../../stores/lock-store.js';
import TaskStore from '../../../stores/task-store.js';
import { TASK_TYPE } from '../../../domain/constants.js';
import DocumentValidationTaskProcessor from './document-validation-task-processor.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../../../test-helper.js';

describe('task-processor', () => {

  const now = new Date();
  const sandbox = createSandbox();

  let sut;
  let ctx;
  let container;
  let taskStore;
  let lockStore;
  let documentValidationTaskProcessor;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    taskStore = container.get(TaskStore);
    lockStore = container.get(LockStore);
    documentValidationTaskProcessor = container.get(DocumentValidationTaskProcessor);
    sut = container.get(TaskProcessor);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
    sandbox.stub(taskStore, 'getUnprocessedTaskById');
    sandbox.stub(taskStore, 'saveTask');
    sandbox.stub(lockStore, 'takeTaskLock');
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(documentValidationTaskProcessor, 'process');
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
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should not call taskStore.getUnprocessedTaskById', () => {
        assert.notCalled(taskStore.getUnprocessedTaskById);
      });

      it('should not call documentValidationTaskProcessor.process', () => {
        assert.notCalled(documentValidationTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        assert.notCalled(taskStore.saveTask);
      });

      it('should not call lockStore.releaseLock', () => {
        assert.notCalled(lockStore.releaseLock);
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
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should not call documentValidationTaskProcessor.process', () => {
        assert.notCalled(documentValidationTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        assert.notCalled(taskStore.saveTask);
      });

      it('should call lockStore.releaseLock', () => {
        assert.calledWith(lockStore.releaseLock, lock);
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
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should not call documentValidationTaskProcessor.process', () => {
        assert.notCalled(documentValidationTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        assert.notCalled(taskStore.saveTask);
      });

      it('should call lockStore.releaseLock', () => {
        assert.calledWith(lockStore.releaseLock, lock);
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
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentValidationTaskProcessor.process', () => {
        assert.calledOnceWithExactly(documentValidationTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        assert.calledWith(taskStore.saveTask, {
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
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when task processing fails for the first time (out of 3 maxAttempts)', () => {
      let expectedError;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };

        nextTask = { _id: taskId, taskType: TASK_TYPE.documentValidation, processed: false, attempts: [] };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        expectedError = new Error('Processing failure 1');
        documentValidationTaskProcessor.process.rejects(expectedError);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentValidationTaskProcessor.process', () => {
        assert.calledWith(documentValidationTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentValidation,
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
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when task processing fails for the third time (out of 3 maxAttempts)', () => {
      let tick1;
      let tick2;
      let tick3;
      let expectedErrors;

      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        tick1 = new Date(sandbox.clock.tick(1000));
        tick2 = new Date(sandbox.clock.tick(1000));
        tick3 = new Date(sandbox.clock.tick(1000));
        expectedErrors = [new Error('Processing failure 1'), new Error('Processing failure 2'), new Error('Processing failure 3')];

        nextTask = {
          _id: taskId,
          taskType: TASK_TYPE.documentValidation,
          processed: false,
          attempts: [
            {
              startedOn: tick1,
              completedOn: tick1,
              errors: [serializeError(expectedErrors[0])]
            },
            {
              startedOn: tick2,
              completedOn: tick2,
              errors: [serializeError(expectedErrors[1])]
            }
          ]
        };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        documentValidationTaskProcessor.process.rejects(expectedErrors[2]);

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentValidationTaskProcessor.process', () => {
        assert.calledWith(documentValidationTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentValidation,
          processed: true,
          attempts: [
            {
              startedOn: tick1,
              completedOn: tick1,
              errors: [serializeError(expectedErrors[0])]
            },
            {
              startedOn: tick2,
              completedOn: tick2,
              errors: [serializeError(expectedErrors[1])]
            },
            {
              startedOn: tick3,
              completedOn: tick3,
              errors: [serializeError(expectedErrors[2])]
            }
          ]
        });
      });

      it('should call lockStore.releaseLock', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when task processing succeeds', () => {
      beforeEach(async () => {
        ctx = { cancellationRequested: false };
        nextTask = {
          _id: taskId,
          taskType: TASK_TYPE.documentValidation,
          processed: false,
          attempts: []
        };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        documentValidationTaskProcessor.process.resolves();

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should call documentValidationTaskProcessor.process', () => {
        assert.calledWith(documentValidationTaskProcessor.process, nextTask, batchParams, ctx);
      });

      it('should call taskStore.saveTask', () => {
        assert.calledWith(taskStore.saveTask, {
          _id: taskId,
          taskType: TASK_TYPE.documentValidation,
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
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when cancellation is requested', () => {
      beforeEach(async () => {
        nextTask = { _id: taskId };
        ctx = { cancellationRequested: true };

        lockStore.takeTaskLock.resolves(lock);
        taskStore.getUnprocessedTaskById.resolves(nextTask);
        documentValidationTaskProcessor.process.resolves();

        await sut.process(taskId, batchParams, ctx);
      });

      it('should call lockStore.takeTaskLock', () => {
        assert.calledOnce(lockStore.takeTaskLock);
      });

      it('should call taskStore.getUnprocessedTaskById', () => {
        assert.calledWith(taskStore.getUnprocessedTaskById, taskId);
      });

      it('should not call documentValidationTaskProcessor.process', () => {
        assert.notCalled(documentValidationTaskProcessor.process);
      });

      it('should not call taskStore.saveTask', () => {
        assert.notCalled(taskStore.saveTask);
      });

      it('should call lockStore.releaseLock', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });
  });
});
