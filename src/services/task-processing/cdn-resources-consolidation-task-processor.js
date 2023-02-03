import Logger from '../../common/logger.js';
import DocumentService from '../document-service.js';

const logger = new Logger(import.meta.url);

class CdnResourcesConsolidationTaskProcessor {
  static get inject() {
    return [DocumentService];
  }

  constructor(documentService) {
    this.documentService = documentService;
  }

  async process(task, ctx) {
    const { documentId } = task.taskParams;

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    logger.info(`Consolidating CDN resources for document with id ${documentId}`);
    await this.documentService.consolidateCdnResources(documentId);
  }
}

export default CdnResourcesConsolidationTaskProcessor;
