import { hrtime } from 'node:process';
import Logger from '../../common/logger.js';
import ToadSchedulerWrapper from './toad-scheduler-wrapper.js';

const logger = new Logger(import.meta.url);

export default class IntervalBasedJobScheduler {
  static dependencies = [ToadSchedulerWrapper];

  constructor(scheduler) {
    this.scheduler = scheduler;
    this.runningTasksCount = 0;
    this.context = null;
    this.jobs = [];
  }

  registerJobs(jobs) {
    this.jobs = jobs;
  }

  start() {
    this.runningTasksCount = 0;
    this.context = { cancellationRequested: false };

    for (const job of this.jobs) {
      this.scheduler.addIntervalJob({
        name: job.name,
        schedule: job.schedule,
        preventOverrun: job.preventOverrun,
        onProcess: async () => {
          logger.debug(`Starting job '${job.name}'`);
          this.runningTasksCount += 1;
          try {
            const startInNs = hrtime.bigint();
            await job.process(this.context);
            const endInNs = hrtime.bigint();
            const durationInMs = (endInNs - startInNs) / 1000000n;
            logger.debug(`Job '${job.name}' finished successfully in ${durationInMs} ms`);
          } catch (error) {
            logger.error(`Error in job '${job.name}':`, error);
          } finally {
            this.runningTasksCount -= 1;
          }
        },
        onError: error => {
          logger.error(`Error in job '${job.name}:'`, error);
        }
      });
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
