import Logger from '../common/logger.js';
import DocumentService from './document-service.js';

const logger = new Logger(import.meta.url);

class DocumentRegenerationTaskProcessor {
  static get inject() {
    return [DocumentService];
  }

  constructor(documentService) {
    this.documentService = documentService;
  }

  async process(task, ctx) {
    const { key } = task.taskParams;

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    logger.info(`Regenerating document with key ${key}`);
    await this.documentService.regenerateDocument(key);
  }
}

export default DocumentRegenerationTaskProcessor;
