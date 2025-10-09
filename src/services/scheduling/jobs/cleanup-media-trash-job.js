import Logger from '../../../common/logger.js';
import MediaLibraryService from '../../media-library-service.js';
import { MEDIA_TRASH_CLEANUP_CRON_PATTERN } from '../../../domain/constants.js';

const logger = new Logger(import.meta.url);

export default class CleanupMediaTrashJob {
  static dependencies = [MediaLibraryService];

  constructor(mediaLibraryService) {
    this.mediaLibraryService = mediaLibraryService;
    this.name = 'cleanup-media-trash';
    this.cronExpression = MEDIA_TRASH_CLEANUP_CRON_PATTERN;
    this.preventOverrun = true;
  }

  async process(context) {
    try {
      await this.mediaLibraryService.cleanupMediaTrash(context);
    } catch (error) {
      logger.error(error);
    }
  }
}
