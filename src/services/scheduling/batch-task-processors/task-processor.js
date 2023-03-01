import Logger from '../../../common/logger.js';
import { serializeError } from 'serialize-error';
import LockStore from '../../../stores/lock-store.js';
import TaskStore from '../../../stores/task-store.js';
import { TASK_TYPE } from '../../../domain/constants.js';
import ServerConfig from '../../../bootstrap/server-config.js';
import DocumentValidationTaskProcessor from './document-validation-task-processor.js';
import DocumentRegenerationTaskProcessor from './document-regeneration-task-processor.js';
import CdnResourcesConsolidationTaskProcessor from './cdn-resources-consolidation-task-processor.js';

const logger = new Logger(import.meta.url);

const MAX_TASK_PROCESSING_ATTEMPTS = 3;

export default class TaskProcessor {
  static dependencies = [
    TaskStore,
    LockStore,
    DocumentValidationTaskProcessor,
    DocumentRegenerationTaskProcessor,
    CdnResourcesConsolidationTaskProcessor,
    ServerConfig
  ];

  constructor(
    taskStore,
    lockStore,
    documentValidationTaskProcessor,
    documentRegenerationTaskProcessor,
    cdnResourcesConsolidationTaskProcessor,
    serverConfig
  ) {
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.serverConfig = serverConfig;

    this.taskProcessors = {
      [TASK_TYPE.documentValidation]: documentValidationTaskProcessor,
      [TASK_TYPE.documentRegeneration]: documentRegenerationTaskProcessor,
      [TASK_TYPE.cdnResourcesConsolidation]: cdnResourcesConsolidationTaskProcessor
    };
  }

  async process(taskId, batchParams, context) {
    let lock;
    try {
      lock = await this.lockStore.takeTaskLock(taskId);
    } catch (err) {
      logger.debug(`Failed to take lock for task ${taskId}, will return`);
      return;
    }

    try {
      const nextTask = await this.taskStore.getUnprocessedTaskById(taskId);
      if (!nextTask) {
        return;
      }

      if (context.cancellationRequested) {
        logger.debug('Cancellation requested, will not attempt processing the task');
        return;
      }

      const currentAttempt = {
        startedOn: new Date(),
        completedOn: null,
        errors: []
      };

      let hasFailedIrrecoverably = false;

      const taskProcessor = this.taskProcessors[nextTask.taskType];
      if (!taskProcessor) {
        throw new Error(`Task type ${nextTask.taskType} is unknown`);
      }

      try {
        await taskProcessor.process(nextTask, batchParams, context);
      } catch (processingError) {
        hasFailedIrrecoverably = !!processingError.isIrrecoverable;
        currentAttempt.errors.push(serializeError(processingError));
      }

      currentAttempt.completedOn = new Date();
      nextTask.attempts.push(currentAttempt);

      nextTask.processed = currentAttempt.errors.length === 0
        || hasFailedIrrecoverably
        || nextTask.attempts.length >= MAX_TASK_PROCESSING_ATTEMPTS;

      await this.taskStore.saveTask(nextTask);
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }
}
