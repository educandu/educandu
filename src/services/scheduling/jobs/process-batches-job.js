import Logger from '../../../common/logger.js';
import { serializeError } from 'serialize-error';
import TaskStore from '../../../stores/task-store.js';
import BatchStore from '../../../stores/batch-store.js';
import TaskProcessor from '../batch-task-processors/task-processor.js';

const logger = new Logger(import.meta.url);

const IDLE_POLL_INTERVAL_IN_MS = 10000;

export default class ProcessBatchesJob {
  static dependencies = [BatchStore, TaskStore, TaskProcessor];

  constructor(batchStore, taskStore, taskProcessor) {
    this.name = 'process-batches';
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.taskProcessor = taskProcessor;
    this.idlePollIntervalInMs = IDLE_POLL_INTERVAL_IN_MS;
  }

  async process(context) {
    let uncompletedBatch;

    try {
      uncompletedBatch = await this.batchStore.getUncompletedBatch();
      if (!uncompletedBatch) {
        logger.debug('No batches to process, will return');
        return false;
      }

      if (context.cancellationRequested) {
        return true;
      }

      const nextCandidateTask = await this.taskStore.getRandomUnprocessedTaskWithBatchId(uncompletedBatch._id);

      if (!nextCandidateTask) {
        logger.debug('No tasks to process, will complete the batch');
        uncompletedBatch.completedOn = new Date();
        await this.batchStore.saveBatch(uncompletedBatch);
        return false;
      }

      if (context.cancellationRequested) {
        return true;
      }

      try {
        await this.taskProcessor.process(nextCandidateTask._id, uncompletedBatch.batchParams, context);
      } catch (taskProcessingError) {
        logger.error(`Error processing task '${nextCandidateTask._id}': `, taskProcessingError);

        uncompletedBatch.errors = [...uncompletedBatch.errors || [], serializeError(taskProcessingError)].slice(-10);
        await this.batchStore.saveBatch(uncompletedBatch);

        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Error processing batch '${uncompletedBatch?._id}': `, error);
      return false;
    }
  }
}
