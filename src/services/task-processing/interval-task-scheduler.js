import toadScheduler from 'toad-scheduler';
import Logger from '../../common/logger.js';
import { Container } from '../../common/di.js';
import LoadSamlMetadataScheduledTask from './load-saml-metadata-scheduled-task.js';

const { ToadScheduler, SimpleIntervalJob, AsyncTask } = toadScheduler;

const logger = new Logger(import.meta.url);

const intervalTaskTypes = [LoadSamlMetadataScheduledTask];

export default class IntervalTaskScheduler {
  static get inject() { return [Container]; }

  constructor(container) {
    this.container = container;
    this.runningTasksCount = 0;
    this.scheduler = null;
    this.context = null;
  }

  start() {
    this.runningTasksCount = 0;
    this.scheduler = new ToadScheduler();
    this.context = { cancellationRequested: false };

    for (const ScheduledTask of intervalTaskTypes) {
      const taskInstance = this.container.get(ScheduledTask);
      const task = new AsyncTask(
        taskInstance.key,
        async () => {
          logger.info(`Starting scheduled task "${taskInstance.key}"`);
          this.runningTasksCount += 1;
          try {
            await taskInstance.process(this.context);
            logger.info(`Scheduled task "${taskInstance.key}" finished successfully`);
          } catch (error) {
            logger.error(`Error in scheduled task "${taskInstance.key}":`, error);
          } finally {
            this.runningTasksCount -= 1;
          }
        },
        error => {
          logger.error(`Error in scheduled task "${taskInstance.key}:"`, error);
        }
      );

      const job = new SimpleIntervalJob(taskInstance.schedule, task);
      const options = { preventOverrun: taskInstance.preventOverrun };
      this.scheduler.addSimpleIntervalJob(job, options);
    }
  }

  async stop() {
    this.context.cancellationRequested = true;
    while (this.runningTasksCount !== 0) {
      await new Promise(resolve => {
        setTimeout(resolve, 250);
      });
    }
  }
}
