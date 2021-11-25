import Logger from '../common/logger.js';

const logger = new Logger(import.meta.url);

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const doWork = async () => {
  logger.debug('1');
  await delay(1000);
  logger.debug('2');
  await delay(1000);
  logger.debug('3');
  await delay(1000);
  logger.debug('4');
  await delay(1000);
  logger.debug('5');
  await delay(1000);
};

export default class TaskScheduler {
  constructor() {
    this.timeout = null;
    this.currentTick = Promise.resolve();
    this.idlePollIntervalInMs = 5000;
    this.cancellationRequested = false;
  }

  start() {
    logger.info('Starting polling for tasks');
    this._tick();
  }

  _tick() {
    logger.info('Setting and executing current tick');
    this.currentTick = (async () => {
      logger.info('TICK');
      const isThereNoMoreWork = await doWork();
      logger.info('isThereNoMoreWork', isThereNoMoreWork);

      if (!this.cancellationRequested) {
        this.timeout = setTimeout(() => this._tick(), isThereNoMoreWork ? this.idlePollIntervalInMs : 0);
      }
    })();
  }

  async dispose() {
    logger.info('Stopping task scheduler');
    this.cancellationRequested = true;
    clearTimeout(this.timeout);
    await this.currentTick;
  }
}
