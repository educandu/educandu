import Logger from '../common/logger.js';
import LessonService from './lesson-service.js';
import DocumentService from './document-service.js';
import { CDN_RESOURCES_CONSOLIDATION_TASK_TYPE } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class CdnResourcesConsolidationTaskProcessor {
  static get inject() {
    return [DocumentService, LessonService];
  }

  constructor(documentService, lessonService) {
    this.documentService = documentService;
    this.lessonService = lessonService;
  }

  async process(task, ctx) {
    const { type, documentId, lessonId } = task.taskParams;

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    switch (type) {
      case CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.document:
        logger.info(`Consolidating CDN resources for document with id ${documentId}`);
        await this.documentService.consolidateCdnResources(documentId);
        break;
      case CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.lesson:
        logger.info(`Consolidating CDN resources for lesson with ID ${lessonId}`);
        await this.lessonService.consolidateCdnResources(lessonId);
        break;
      default:
        throw new Error(`Invalid CDN resources consolidation task type '${type}'`);
    }
  }
}

export default CdnResourcesConsolidationTaskProcessor;
