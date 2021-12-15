import Logger from '../common/logger.js';
import BatchProcessor from './batch-processor.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';

const logger = new Logger(import.meta.url);
export default class TaskScheduler {
  static get inject() { return [BatchProcessor, ServerConfig]; }

  constructor(batchProcessor, serverConfig) {
    this.timeout = null;
    this.batchProcessor = batchProcessor;
    this.currentTick = Promise.resolve();
    this.serverConfig = serverConfig;
    this.context = { cancellationRequested: false };
  }

  start() {
    logger.info('Starting task scheduler');
    this._tick();
  }

  _tick() {
    logger.debug('Setting and executing current tick');
    this.currentTick = (async () => {
      let isThereMoreWork;

      try {
        isThereMoreWork = await this.batchProcessor.process(this.context);
      } catch (error) {
        logger.error('Error in batch processor: ', error);
        isThereMoreWork = false;
      }

      if (!this.context.cancellationRequested) {
        const nextPollTimeSpan = isThereMoreWork ? 0 : this.serverConfig.taskProcessing.idlePollIntervalInMs;
        this.timeout = setTimeout(() => this._tick(), nextPollTimeSpan);
      }
    })();
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.domain,
      dispose: async () => {
        logger.info('Stopping task scheduler');
        this.context.cancellationRequested = true;
        clearTimeout(this.timeout);
        await this.currentTick;
        logger.info('Task scheduler stopped');
      }
    };
  }
}
