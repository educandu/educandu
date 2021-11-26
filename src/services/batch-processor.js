import Logger from '../common/logger.js';
import TaskStore from '../stores/task-store.js';
import BatchStore from '../stores/batch-store.js';
import TaskLockStore from '../stores/task-lock-store.js';

const logger = new Logger(import.meta.url);

const MAX_ATTEMPTS = 3;

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const processTask = async (task, ctx) => {
  await delay(2000);
  if (ctx.cancellationRequested) {
    return true;
  }

  if (Math.random() > 0.5) {
    throw new Error('Mäh');
  }

  return true;
};

export default class BatchProcessor {
  static get inject() { return [BatchStore, TaskStore, TaskLockStore]; }

  constructor(batchStore, taskStore, taskLockStore) {
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.taskLockStore = taskLockStore;
  }

  async process(ctx) {
    const uncompletedBatch = await this.batchStore.findOne({ completedOn: null });
    if (!uncompletedBatch) {
      logger.debug('No more batches to process, will return');
      return false;
    }

    const nextCandidateTask = await this.taskStore.findRandomOne({ processed: false });
    if (!nextCandidateTask) {
      logger.debug('No more tasks to process, will complete the batch');
      uncompletedBatch.completedOn = new Date();
      await this.batchStore.save(uncompletedBatch);
      return false;
    }

    logger.debug('Task to process', nextCandidateTask);
    let lock;
    try {
      lock = await this.taskLockStore.takeLock(nextCandidateTask._id);
    } catch (err) {
      logger.debug(`Failed to take lock for task ${nextCandidateTask._id}, will return`);
      return true;
    }

    try {
      const nextTask = await this.taskStore.findOne({ _id: nextCandidateTask._id, processed: false });
      if (!nextTask) {
        logger.debug('Candidate has been already processed, will skip');
        return true;
      }

      const currentAttempt = {
        startedOn: new Date(),
        completedOn: null,
        errors: []
      };

      try {
        logger.debug('Processing task');
        await processTask(nextTask, ctx);
      } catch (processError) {
        logger.debug('Error processing task', processError);
        currentAttempt.errors.push(processError.message);
      }

      currentAttempt.completedOn = new Date();
      nextTask.attempts.push(currentAttempt);

      const attemptsExhausted = nextTask.attempts.length >= MAX_ATTEMPTS;
      const taskSuccessfullyProcessed = currentAttempt.errors.length === 0;
      if (attemptsExhausted || taskSuccessfullyProcessed) {
        logger.debug(`Marking task as processed due to: ${attemptsExhausted ? 'exhausted attempts' : 'error processing task'}`);
        nextTask.processed = true;
      }

      logger.debug('Saving task');
      this.taskStore.save(nextTask);
      return true;

    } finally {
      this.taskLockStore.releaseLock(lock);
    }
  }
}
