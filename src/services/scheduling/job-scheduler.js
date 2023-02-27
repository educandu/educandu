import Logger from '../../common/logger.js';
import ProcessEventsJob from './jobs/process-events-job.js';
import ProcessBatchesJob from './jobs/process-batches-job.js';
import LoadSamlMetadataJob from './jobs/load-saml-metadata-job.js';
import AlwaysRunningJobScheduler from './always-running-job-scheduler.js';
import IntervalBasedJobScheduler from './interval-based-job-scheduler.js';
import { getDisposalInfo, DISPOSAL_PRIORITY, Container } from '../../common/di.js';

const logger = new Logger(import.meta.url);

const jobs = {
  // An always running job ...
  // * has to have an async `process(context)` function that resolves to truthy if there is more work, or to falsy if it can switch to idle
  // * has to have a unique `name` field in order for the scheduler to create a meaningful log message in case an error occurs
  // * has to have an `idlePollIntervalInMs` field to specify how long to wait for the next `process(context)` call when idle
  alwaysRunning: [ProcessEventsJob, ProcessBatchesJob],

  // An interval based job ...
  // * has to have an async `process(context)` function
  // * has to have a unique `name` field in order for the scheduler to create a meaningful log message in case an error occurs
  // * has to have a `schedule` object field to specify the interval (for API see: https://github.com/kibertoad/toad-scheduler#api-for-schedule)
  // * has to have a `preventOverrun` boolean field that when set to true will prevent the next run from being fired up while the previous one is still executing
  intervalBased: [LoadSamlMetadataJob]
};

export default class JobScheduler {
  static dependencies = [Container, AlwaysRunningJobScheduler, IntervalBasedJobScheduler];

  constructor(container, alwaysRunningJobScheduler, intervalBasedJobScheduler) {
    this.container = container;
    this.alwaysRunningJobScheduler = alwaysRunningJobScheduler;
    this.intervalBasedJobScheduler = intervalBasedJobScheduler;
    this.alwaysRunningJobScheduler.registerJobs(jobs.alwaysRunning.map(jobType => this.container.get(jobType)));
    this.intervalBasedJobScheduler.registerJobs(jobs.intervalBased.map(jobType => this.container.get(jobType)));
  }

  start() {
    logger.info('Starting job scheduler');
    this.alwaysRunningJobScheduler.start();
    this.intervalBasedJobScheduler.start();
  }

  async stop() {
    logger.info('Stopping job scheduler');
    await Promise.all([this.alwaysRunningJobScheduler.stop(), this.intervalBasedJobScheduler.stop()]);
    logger.info('Job scheduler stopped');
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: () => this.stop()
    };
  }
}
