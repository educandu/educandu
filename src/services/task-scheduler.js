import Logger from '../common/logger.js';

const logger = new Logger(import.meta.url);

const delay = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const doWork = async ctx => {
  logger.debug('1');
  await delay(1000);
  if (ctx.cancellationRequested) {
    return true;
  }
  logger.debug('2');
  await delay(1000);
  if (ctx.cancellationRequested) {
    return true;
  }
  logger.debug('3');
  await delay(1000);
  if (ctx.cancellationRequested) {
    return true;
  }
  logger.debug('4');
  await delay(1000);
  if (ctx.cancellationRequested) {
    return true;
  }
  logger.debug('5');
  await delay(1000);
  if (ctx.cancellationRequested) {
    return true;
  }
  return true;
};

export default class TaskScheduler {
  constructor() {
    this.timeout = null;
    this.currentTick = Promise.resolve();
    this.idlePollIntervalInMs = 5000;
    this.context = { cancellationRequested: false };
  }

  start() {
    logger.info('Starting polling for tasks');
    this._tick();
  }

  _tick() {
    logger.info('Setting and executing current tick');
    this.currentTick = (async () => {
      logger.info('TICK');
      const isThereMoreWork = await doWork(this.context);
      logger.info('isThereMoreWork', isThereMoreWork);

      if (!this.context.cancellationRequested) {
        const nextPollTimeSpan = isThereMoreWork ? 0 : this.idlePollIntervalInMs;
        this.timeout = setTimeout(() => this._tick(), nextPollTimeSpan);
      }
    })();
  }

  async dispose() {
    logger.info('Stopping task scheduler');
    this.context.cancellationRequested = true;
    clearTimeout(this.timeout);
    await this.currentTick;
  }
}
