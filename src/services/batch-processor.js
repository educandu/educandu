import Logger from '../common/logger.js';
import TaskStore from '../stores/task-store.js';
import TaskProcessor from './task-processor.js';
import { serializeError } from 'serialize-error';
import BatchStore from '../stores/batch-store.js';

const logger = new Logger(import.meta.url);

export default class BatchProcessor {
  static get inject() { return [BatchStore, TaskStore, TaskProcessor]; }

  constructor(batchStore, taskStore, taskProcessor) {
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.taskProcessor = taskProcessor;
  }

  async process(ctx) {
    let uncompletedBatch;

    try {
      uncompletedBatch = await this.batchStore.findOne({ completedOn: null });
      if (!uncompletedBatch) {
        logger.debug('No more batches to process, will return');
        return false;
      }

      if (ctx.cancellationRequested) {
        return true;
      }

      const nextCandidateTask = await this.taskStore.findRandomOne({
        $and: [{ processed: false }, { batchId: uncompletedBatch._id }]
      });

      if (!nextCandidateTask) {
        logger.debug('No more tasks to process, will complete the batch');
        uncompletedBatch.completedOn = new Date();
        await this.batchStore.save(uncompletedBatch);
        return false;
      }

      if (ctx.cancellationRequested) {
        return true;
      }

      try {
        logger.debug('Task to process', nextCandidateTask);
        await this.taskProcessor.process(nextCandidateTask._id, uncompletedBatch.batchParams, ctx);
      } catch (taskProcessingError) {
        logger.error(`Error processing task '${nextCandidateTask._id}': `, taskProcessingError);

        uncompletedBatch.errors = [...uncompletedBatch.errors || [], serializeError(taskProcessingError)].slice(-10);
        await this.batchStore.save(uncompletedBatch);

        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Error processing batch '${uncompletedBatch?._id}': `, error);
      return false;
    }
  }
}
