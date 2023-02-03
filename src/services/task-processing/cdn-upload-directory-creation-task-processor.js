import Logger from '../../common/logger.js';
import RoomService from '../room-service.js';
import DocumentService from '../document-service.js';
import { CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE } from '../../domain/constants.js';

const logger = new Logger(import.meta.url);

class CdnUploadDirectoryCreationTaskProcessor {
  static get inject() {
    return [DocumentService, RoomService];
  }

  constructor(documentService, roomService) {
    this.documentService = documentService;
    this.roomService = roomService;
  }

  async process(task, ctx) {
    const { type, documentId, roomId } = task.taskParams;

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    switch (type) {
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document:
        logger.info(`Creating CDN upload directory for document with id ${documentId}`);
        await this.documentService.createUploadDirectoryMarkerForDocument(documentId);
        break;
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.room:
        logger.info(`Creating CDN upload directory for room with ID ${roomId}`);
        await this.roomService.createUploadDirectoryMarkerForRoom(roomId);
        break;
      default:
        throw new Error(`Invalid CDN upload directory creation task type '${type}'`);
    }
  }
}

export default CdnUploadDirectoryCreationTaskProcessor;
