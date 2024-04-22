import Logger from '../../../common/logger.js';
import RoomService from '../../room-service.js';
import UserService from '../../user-service.js';
import SettingService from '../../setting-service.js';
import DocumentService from '../../document-service.js';
import DocumentCategoryService from '../../document-category-service.js';
import { CDN_RESOURCES_CONSOLIDATION_TYPE } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

class CdnResourcesConsolidationTaskProcessor {
  static dependencies = [DocumentService, DocumentCategoryService, RoomService, UserService, SettingService];

  constructor(documentService, documentCategoryService, roomService, userService, settingService) {
    this.documentService = documentService;
    this.documentCategoryService = documentCategoryService;
    this.roomService = roomService;
    this.userService = userService;
    this.settingService = settingService;
  }

  async process(task, ctx) {
    const { type, entityId } = task.taskParams;

    if (ctx.cancellationRequested) {
      throw new Error('Cancellation requested');
    }

    switch (type) {
      case CDN_RESOURCES_CONSOLIDATION_TYPE.document:
        logger.info(`Consolidating CDN resources for document with id ${entityId}`);
        await this.documentService.consolidateCdnResources(entityId);
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.documentCategory:
        logger.info(`Consolidating CDN resources for document category with id ${entityId}`);
        await this.documentCategoryService.consolidateCdnResources(entityId);
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.room:
        logger.info(`Consolidating CDN resources for room with id ${entityId}`);
        await this.roomService.consolidateCdnResources(entityId);
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.user:
        logger.info(`Consolidating CDN resources for user with id ${entityId}`);
        await this.userService.consolidateCdnResources(entityId);
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.setting:
        logger.info(`Consolidating CDN resources for setting with id ${entityId}`);
        await this.settingService.consolidateCdnResources(entityId);
        break;
      default:
        throw new Error(`Invalid CDN resources consolidation type '${type}'`);
    }
  }
}

export default CdnResourcesConsolidationTaskProcessor;
