import Logger from '../../common/logger.js';
import BatchProcessor from './batch-processor.js';
import ServerConfig from '../../bootstrap/server-config.js';

const logger = new Logger(import.meta.url);

export default class BatchTaskScheduler {
  static get inject() { return [ServerConfig, BatchProcessor]; }

  constructor(serverConfig, batchProcessor) {
    this.timeout = null;
    this.serverConfig = serverConfig;
    this.batchProcessor = batchProcessor;
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
    logger.debug('Setting and executing current tick');
    this.currentTick = (async () => {
      let isThereMoreWork;

      try {
        isThereMoreWork = await this.batchProcessor.process(this.context);
      } catch (error) {
        logger.error('Error in batch processor:', error);
        isThereMoreWork = false;
      }

      if (!this.context.cancellationRequested) {
        const nextPollTimeSpan = isThereMoreWork ? 0 : this.serverConfig.taskProcessing.idlePollIntervalInMs;
        this.timeout = setTimeout(() => this._tick(), nextPollTimeSpan);
      }
    })();
  }
}
