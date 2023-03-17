/* eslint-disable no-unused-vars */
/* eslint-disable array-bracket-spacing */

import Logger from '../../common/logger.js';
import CronJobScheduler from './cron-job-scheduler.js';
import ProcessEventsJob from './jobs/process-events-job.js';
import ProcessBatchesJob from './jobs/process-batches-job.js';
import LoadSamlMetadataJob from './jobs/load-saml-metadata-job.js';
import AlwaysRunningJobScheduler from './always-running-job-scheduler.js';
import IntervalBasedJobScheduler from './interval-based-job-scheduler.js';
import SendNotificationEmailsJob from './jobs/send-notification-emails-job.js';
import { getDisposalInfo, DISPOSAL_PRIORITY, Container } from '../../common/di.js';

const logger = new Logger(import.meta.url);

const jobs = {
  // An always running job ...
  // * has to have an async `process(context)` function that resolves to truthy if there is more work, or to falsy if it can switch to idle
  // * has to have a unique `name` field in order for the scheduler to create a meaningful log message in case an error occurs
  // * has to have an `idlePollIntervalInMs` field to specify how long to wait for the next `process(context)` call when idle
  alwaysRunning: [/* ProcessEventsJob,*/ ProcessBatchesJob],

  // An interval based job ...
  // * has to have an async `process(context)` function
  // * has to have a unique `name` field in order for the scheduler to create a meaningful log message in case an error occurs
  // * has to have a `schedule` object field to specify the interval (for API see: https://github.com/kibertoad/toad-scheduler#api-for-schedule)
  // * has to have a `preventOverrun` boolean field that when set to true will prevent the next run from being fired up while the previous one is still executing
  intervalBased: [LoadSamlMetadataJob],

  // A cron job ...
  // * has to have an async `process(context)` function
  // * has to have a unique `name` field in order for the scheduler to create a meaningful log message in case an error occurs
  // * has to have a `cronExpression` string field to specify the pattern for croner (see also: https://www.npmjs.com/package/croner), like this:
  // ┌──────────────── (optional) second (0 - 59)
  // │ ┌────────────── minute (0 - 59)
  // │ │ ┌──────────── hour (0 - 23)
  // │ │ │ ┌────────── day of month (1 - 31)
  // │ │ │ │ ┌──────── month (1 - 12, JAN-DEC)
  // │ │ │ │ │ ┌────── day of week (0 - 6, SUN-MON) (0 to 6 are Sunday to Saturday; 7 is Sunday, the same as 0)
  // │ │ │ │ │ │
  // * * * * * *
  // * has to have a `preventOverrun` boolean field that when set to true will prevent the next run from being fired up while the previous one is still executing
  cron: [SendNotificationEmailsJob]
};

export default class JobScheduler {
  static dependencies = [Container, AlwaysRunningJobScheduler, IntervalBasedJobScheduler, CronJobScheduler];

  constructor(container, alwaysRunningJobScheduler, intervalBasedJobScheduler, cronJobScheduler) {
    this.container = container;
    this.alwaysRunningJobScheduler = alwaysRunningJobScheduler;
    this.intervalBasedJobScheduler = intervalBasedJobScheduler;
    this.cronJobScheduler = cronJobScheduler;
    this.alwaysRunningJobScheduler.registerJobs(jobs.alwaysRunning.map(jobType => this.container.get(jobType)));
    this.intervalBasedJobScheduler.registerJobs(jobs.intervalBased.map(jobType => this.container.get(jobType)));
    this.cronJobScheduler.registerJobs(jobs.cron.map(jobType => this.container.get(jobType)));
  }

  start() {
    logger.info('Starting job scheduler');
    this.alwaysRunningJobScheduler.start();
    this.intervalBasedJobScheduler.start();
    this.cronJobScheduler.start();
  }

  async stop() {
    logger.info('Stopping job scheduler');
    await Promise.all([
      this.alwaysRunningJobScheduler.stop(),
      this.intervalBasedJobScheduler.stop(),
      this.cronJobScheduler.stop()
    ]);
    logger.info('Job scheduler stopped');
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: () => this.stop()
    };
  }
}
