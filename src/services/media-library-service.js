import Cdn from '../repositories/cdn.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import escapeStringRegexp from 'escape-string-regexp';
import { CDN_URL_PREFIX } from '../domain/constants.js';
import { createTagSearchQuery } from '../utils/tag-utils.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';
import { createUniqueStorageFileName, getMediaLibraryItemPath } from '../utils/storage-utils.js';

class MediaLibraryService {
  static get inject() {
    return [Cdn, MediaLibraryItemStore];
  }

  constructor(cdn, mediaLibraryItemStore) {
    this.cdn = cdn;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
  }

  // Call this for the search
  async getSearchableMediaLibraryItemsByTags(searchQuery) {
    const tagQuery = createTagSearchQuery(searchQuery);
    if (!tagQuery.isValid) {
      return [];
    }

    const queryConditions = [tagQuery.query];
    const mediaLibraryItems = await this.mediaLibraryItemStore.getMediaLibraryItemsByConditions(queryConditions);
    return mediaLibraryItems.map(item => ({
      ...item,
      relevance: item.tags.filter(tag => tagQuery.positiveTokens.has(tag.toLowerCase())).length
    }));
  }

  // Call this for the tag suggestions autocomplete
  getMediaLibraryItemTagsMatchingText(searchString) {
    const sanitizedSearchString = escapeStringRegexp((searchString || '').trim());
    return this.mediaLibraryItemStore.getMediaLibraryItemTagsMatchingText(sanitizedSearchString);
  }

  // Extend and adjust this together with the UI, this is just a skeleton
  async createMediaLibraryItem({ data, user }) {
    const now = new Date();
    const mediaLibraryItemId = uniqueId.create();

    const storageFileName = createUniqueStorageFileName(data.originalFileName, () => mediaLibraryItemId);
    const storagePath = urlUtils.concatParts(getMediaLibraryItemPath(), storageFileName);
    const storageUrl = `${CDN_URL_PREFIX}${storagePath}`;
    const newMediaLibraryItem = {
      _id: mediaLibraryItemId,
      createdBy: user._id,
      createdOn: now,
      updatedBy: user._id,
      updatedOn: now,
      url: storageUrl
      // tags, license, etc.
    };

    try {
      await this.cdn.uploadObject(storagePath, data.filePath);
      await this.mediaLibraryItemStore.insertMediaLibraryItem(newMediaLibraryItem);
      return newMediaLibraryItem;
    } catch (error) {
      await this.cdn.deleteObject(storagePath);
      throw error;
    }
  }
}

export default MediaLibraryService;
