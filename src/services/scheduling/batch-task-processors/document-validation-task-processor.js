import Logger from '../../../common/logger.js';
import DocumentService from '../../document-service.js';

const logger = new Logger(import.meta.url);

class DocumentValidationTaskProcessor {
  static dependencies = [DocumentService];

  constructor(documentService) {
    this.documentService = documentService;
  }

  async process(task, ctx) {
    const { documentId } = task.taskParams;

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    logger.info(`Validating document with id ${documentId}`);
    await this.documentService.validateDocument(documentId);
  }
}

export default DocumentValidationTaskProcessor;
