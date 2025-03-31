import moment from 'moment';
import Cdn from '../stores/cdn.js';
import Logger from '../common/logger.js';
import urlUtils from '../utils/url-utils.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getMediaTrashPath } from '../utils/storage-utils.js';
import MediaTrashStore from '../stores/media-trash-item-store.js';

const logger = new Logger(import.meta.url);

class MediaTrashService {
  static dependencies = [MediaTrashStore, Cdn, ServerConfig];

  constructor(mediaTrashStore, cdn, serverConfig) {
    this.mediaTrashStore = mediaTrashStore;
    this.cdn = cdn;
    this.serverConfig = serverConfig;
  }

  async cleanupMediaTrash(context) {
    const now = new Date();
    const beforeDate = moment(now).add(this.serverConfig.mediaTrashExpiryTimeoutInDays, 'days').toDate();

    const itemsToDelete = await this.mediaTrashStore.getMediaTrashItemsMetadataCreatedBefore(beforeDate);
    if (!itemsToDelete.length) {
      logger.info('Cleaning up media trash: no items to delete');
      return;
    }

    for (const itemToDelete of itemsToDelete) {
      if (context.cancellationRequested) {
        logger.info('Cleaning up media trash has been cancelled');
        return;
      }

      const storagePath = urlUtils.concatParts(getMediaTrashPath(), itemToDelete.name);
      try {
        await this.cdn.deleteObject(storagePath);
        await this.mediaTrashStore.deleteMediaTrashItem(itemToDelete._id);
        logger.info(`Successfully deleted ${storagePath} while cleaning up media trash`);
      } catch (error) {
        logger.error(`Error deleting ${storagePath} while cleaning up media trash`, error);
      }
    }
  }
}

export default MediaTrashService;
