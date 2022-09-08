import Logger from '../common/logger.js';
import LockStore from '../stores/lock-store.js';
import TaskStore from '../stores/task-store.js';
import { serializeError } from 'serialize-error';
import { TASK_TYPE } from '../domain/constants.js';
import ServerConfig from '../bootstrap/server-config.js';
import DocumentImportTaskProcessor from './document-import-task-processor.js';
import DocumentValidationTaskProcessor from './document-validation-task-processor.js';
import DocumentRegenerationTaskProcessor from './document-regeneration-task-processor.js';
import CdnResourcesConsolidationTaskProcessor from './cdn-resources-consolidation-task-processor.js';
import CdnUploadDirectoryCreationTaskProcessor from './cdn-upload-directory-creation-task-processor.js';

const logger = new Logger(import.meta.url);

export default class TaskProcessor {
  static get inject() {
    return [
      TaskStore,
      LockStore,
      DocumentImportTaskProcessor,
      DocumentValidationTaskProcessor,
      DocumentRegenerationTaskProcessor,
      CdnResourcesConsolidationTaskProcessor,
      CdnUploadDirectoryCreationTaskProcessor,
      ServerConfig
    ];
  }

  constructor(
    taskStore,
    lockStore,
    documentImportTaskProcessor,
    documentValidationTaskProcessor,
    documentRegenerationTaskProcessor,
    cdnResourcesConsolidationTaskProcessor,
    cdnUploadDirectoryCreationTaskProcessor,
    serverConfig
  ) {
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.serverConfig = serverConfig;

    this.taskProcessors = {
      [TASK_TYPE.documentImport]: documentImportTaskProcessor,
      [TASK_TYPE.documentValidation]: documentValidationTaskProcessor,
      [TASK_TYPE.documentRegeneration]: documentRegenerationTaskProcessor,
      [TASK_TYPE.cdnResourcesConsolidation]: cdnResourcesConsolidationTaskProcessor,
      [TASK_TYPE.cdnUploadDirectoryCreation]: cdnUploadDirectoryCreationTaskProcessor
    };
  }

  async process(taskId, batchParams, ctx) {
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
        logger.debug('Candidate has been already processed, will skip');
        return;
      }

      if (ctx.cancellationRequested) {
        logger.debug('Cancellation requested, will not attempt processing the task');
        return;
      }

      const currentAttempt = {
        startedOn: new Date(),
        completedOn: null,
        errors: []
      };

      const taskProcessor = this.taskProcessors[nextTask.taskType];
      if (!taskProcessor) {
        throw new Error(`Task type ${nextTask.taskType} is unknown`);
      }

      try {
        logger.debug('Processing task');
        await taskProcessor.process(nextTask, batchParams, ctx);
      } catch (processingError) {
        logger.debug(`Error processing task '${nextTask?._id}':`, processingError);
        currentAttempt.errors.push(serializeError(processingError));
      }

      currentAttempt.completedOn = new Date();
      nextTask.attempts.push(currentAttempt);

      const attemptsExhausted = nextTask.attempts.length >= this.serverConfig.taskProcessing.maxAttempts;
      const taskSuccessfullyProcessed = currentAttempt.errors.length === 0;
      if (taskSuccessfullyProcessed || attemptsExhausted) {
        logger.debug(`Marking task as processed due to: ${attemptsExhausted ? 'exhausted attempts' : 'task succesfully processed'}`);
        nextTask.processed = true;
      }

      logger.debug('Saving task');
      await this.taskStore.saveTask(nextTask);
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }
}
