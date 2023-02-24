import Logger from '../../common/logger.js';
import BatchTaskScheduler from './batch-task-scheduler.js';
import IntervalTaskScheduler from './interval-task-scheduler.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../../common/di.js';

const logger = new Logger(import.meta.url);

export default class TaskScheduler {
  static dependencies = [BatchTaskScheduler, IntervalTaskScheduler];

  constructor(batchTaskScheduler, scheduledTaskRunner) {
    this.batchTaskScheduler = batchTaskScheduler;
    this.scheduledTaskRunner = scheduledTaskRunner;
  }

  start() {
    logger.info('Starting task scheduler');
    this.batchTaskScheduler.start();
    this.scheduledTaskRunner.start();
  }

  async stop() {
    logger.info('Stopping task scheduler');
    await Promise.all([this.batchTaskScheduler.stop(), this.scheduledTaskRunner.stop()]);
    logger.info('Task scheduler stopped');
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: () => this.stop()
    };
  }
}
