import Logger from '../../common/logger.js';

const logger = new Logger(import.meta.url);

class JobRunner {
  constructor(job) {
    this.job = job;
    this.timeout = null;
    this.currentTick = Promise.resolve();
    this.context = { cancellationRequested: false };
  }

  start() {
    this._tick();
  }

  async stop() {
    this.context.cancellationRequested = true;
    clearTimeout(this.timeout);
    await this.currentTick;
  }

  _tick() {
    logger.debug(`Starting job '${this.job.name}'`);
    this.currentTick = (async () => {
      let isThereMoreWork;

      try {
        isThereMoreWork = await this.job.process(this.context);
        logger.debug(`Job '${this.job.name}' finished successfully`);
      } catch (error) {
        logger.error(`Error in job '${this.job.name}':`, error);
        isThereMoreWork = false;
      }

      if (!this.context.cancellationRequested) {
        const nextPollTimeSpan = isThereMoreWork ? 0 : this.job.idlePollIntervalInMs;
        this.timeout = setTimeout(() => this._tick(), nextPollTimeSpan);
      }
    })();
  }
}

export default class AlwaysRunningJobScheduler {
  constructor() {
    this.jobs = [];
    this.runners = [];
  }

  registerJobs(jobs) {
    this.jobs = jobs;
  }

  start() {
    this.runners = this.jobs.map(job => new JobRunner(job));
    this.runners.forEach(runner => runner.start());
  }

  stop() {
    return Promise.all(this.runners.map(runner => runner.stop()));
  }
}
