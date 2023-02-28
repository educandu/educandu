import toadScheduler from 'toad-scheduler';
import Logger from '../../common/logger.js';

const { ToadScheduler, SimpleIntervalJob, AsyncTask } = toadScheduler;

const logger = new Logger(import.meta.url);

export default class IntervalBasedJobScheduler {
  constructor() {
    this.runningTasksCount = 0;
    this.scheduler = null;
    this.context = null;
    this.jobs = [];
  }

  registerJobs(jobs) {
    this.jobs = jobs;
  }

  start() {
    this.runningTasksCount = 0;
    this.scheduler = new ToadScheduler();
    this.context = { cancellationRequested: false };

    for (const job of this.jobs) {
      const task = new AsyncTask(
        job.name,
        async () => {
          logger.debug(`Starting job '${job.name}'`);
          this.runningTasksCount += 1;
          try {
            await job.process(this.context);
            logger.debug(`Job '${job.name}' finished successfully`);
          } catch (error) {
            logger.error(`Error in job '${job.name}':`, error);
          } finally {
            this.runningTasksCount -= 1;
          }
        },
        error => {
          logger.error(`Error in job '${job.name}:'`, error);
        }
      );

      const toadJob = new SimpleIntervalJob(job.schedule, task);
      const options = { preventOverrun: job.preventOverrun };
      this.scheduler.addSimpleIntervalJob(toadJob, options);
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
