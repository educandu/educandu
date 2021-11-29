import Logger from '../common/logger.js';
import TaskStore from '../stores/task-store.js';
import TaskProcessor from './task-processor.js';
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
    const uncompletedBatch = await this.batchStore.findOne({ completedOn: null });
    if (!uncompletedBatch) {
      logger.debug('No more batches to process, will return');
      return false;
    }

    if (ctx.cancellationRequested) {
      return true;
    }

    const nextCandidateTask = await this.taskStore.findRandomOne({ processed: false });
    if (!nextCandidateTask) {
      logger.debug('No more tasks to process, will complete the batch');
      uncompletedBatch.completedOn = new Date();
      await this.batchStore.save(uncompletedBatch);
      return false;
    }

    if (ctx.cancellationRequested) {
      return true;
    }

    logger.debug('Task to process', nextCandidateTask);
    await this.taskProcessor.process(nextCandidateTask._id, uncompletedBatch.batchParams, ctx);
    return true;
  }
}
