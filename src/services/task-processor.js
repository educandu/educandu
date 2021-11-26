import Logger from '../common/logger.js';
import TaskStore from '../stores/task-store.js';
import TaskLockStore from '../stores/task-lock-store.js';

const logger = new Logger(import.meta.url);

const MAX_ATTEMPTS = 3;

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const processTask = async (task, ctx) => {
  await delay(2000);
  if (ctx.cancellationRequested) {
    throw new Error();
  }

  if (Math.random() > 0.5) {
    throw new Error('Mäh');
  }
};

export default class TaskProcessor {
  static get inject() { return [TaskStore, TaskLockStore]; }

  constructor(taskStore, taskLockStore) {
    this.taskStore = taskStore;
    this.taskLockStore = taskLockStore;
  }

  async process(taskId, ctx) {
    let lock;
    try {
      lock = await this.taskLockStore.takeLock(taskId);
    } catch (err) {
      logger.debug(`Failed to take lock for task ${taskId}, will return`);
      return;
    }

    try {
      const nextTask = await this.taskStore.findOne({ _id: taskId, processed: false });
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

    } finally {
      this.taskLockStore.releaseLock(lock);
    }
  }
}
