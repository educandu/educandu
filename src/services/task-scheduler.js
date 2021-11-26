import Logger from '../common/logger.js';
import BatchProcessor from './batch-processor.js';

const logger = new Logger(import.meta.url);
export default class TaskScheduler {
  static get inject() { return [BatchProcessor]; }

  constructor(batchProcessor) {
    this.timeout = null;
    this.batchProcessor = batchProcessor;
    this.currentTick = Promise.resolve();
    this.idlePollIntervalInMs = 5000;
    this.context = { cancellationRequested: false };
  }

  start() {
    logger.info('Starting task scheduler');
    this._tick();
  }

  _tick() {
    logger.info('Setting and executing current tick');
    this.currentTick = (async () => {
      const isThereMoreWork = await this.batchProcessor.process(this.context);

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
