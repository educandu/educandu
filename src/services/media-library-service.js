import by from 'thenby';
import mime from 'mime';
import Cdn from '../stores/cdn.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import { getCdnPath } from '../utils/source-utils.js';
import escapeStringRegexp from 'escape-string-regexp';
import { getResourceType } from '../utils/resource-utils.js';
import { createTextSearchQuery } from '../utils/query-utils.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';
import { CDN_URL_PREFIX, DEFAULT_CONTENT_TYPE } from '../domain/constants.js';
import { createUniqueStorageFileName, getMediaLibraryPath } from '../utils/storage-utils.js';

class MediaLibraryService {
  static dependencies = [Cdn, MediaLibraryItemStore];

  constructor(cdn, mediaLibraryItemStore) {
    this.cdn = cdn;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
  }

  getAllMediaLibraryItems() {
    return this.mediaLibraryItemStore.getAllMediaLibraryItems();
  }

  async getSearchableMediaLibraryItemsByTagsOrName({ query, resourceTypes }) {
    const textQuery = createTextSearchQuery(query, ['tags', 'name']);
    if (!textQuery.isValid) {
      return [];
    }

    const textAndResourceTypeQueryConditions = [textQuery.query, { resourceType: { $in: resourceTypes } }];
    const mediaLibraryItems = await this.mediaLibraryItemStore.getMediaLibraryItemsByConditions(textAndResourceTypeQueryConditions);

    const positiveTokensArray = [...textQuery.positiveTokens].filter(token => token.toLowerCase());
    return mediaLibraryItems
      .map(item => {
        const exactTagMatchCount = item.tags.filter(tag => textQuery.positiveTokens.has(tag.toLowerCase())).length;
        const partialNameMatchCount = positiveTokensArray.filter(token => item.name.toLowerCase().includes(token)).length;
        const relevance = exactTagMatchCount + partialNameMatchCount;
        return { ...item, relevance };
      })
      .sort(by(item => item.relevance).thenBy(item => item.name));
  }

  async getMediaLibraryItemByUrl({ url }) {
    const mediaLibraryItem = await this.mediaLibraryItemStore.getMediaLibraryItemByUrl(url);
    return mediaLibraryItem || null;
  }

  async createMediaLibraryItem({ file, metadata, user }) {
    const now = new Date();
    const mediaLibraryItemId = uniqueId.create();

    const storageFileName = createUniqueStorageFileName(file.originalname, () => mediaLibraryItemId);
    const storagePath = urlUtils.concatParts(getMediaLibraryPath(), storageFileName);
    const storageUrl = `${CDN_URL_PREFIX}${storagePath}`;

    const resourceType = getResourceType(storageUrl);
    const contentType = mime.getType(storageUrl) || DEFAULT_CONTENT_TYPE;
    const size = file.size;

    const newMediaLibraryItem = {
      _id: mediaLibraryItemId,
      resourceType,
      contentType,
      size,
      createdBy: user._id,
      createdOn: now,
      updatedBy: user._id,
      updatedOn: now,
      url: storageUrl,
      name: storageFileName,
      shortDescription: metadata.shortDescription,
      languages: metadata.languages,
      licenses: metadata.licenses,
      tags: metadata.tags
    };

    try {
      await this.cdn.uploadObject(storagePath, file.path);
      return this.mediaLibraryItemStore.insertMediaLibraryItem(newMediaLibraryItem);
    } catch (error) {
      await this.cdn.deleteObject(storagePath);
      throw error;
    }
  }

  updateMediaLibraryItem({ mediaLibraryItemId, data, user }) {
    const now = new Date();

    const newMediaLibraryItemMetadata = {
      updatedBy: user._id,
      updatedOn: now,
      shortDescription: data.shortDescription,
      languages: data.languages,
      licenses: data.licenses,
      tags: data.tags
    };

    return this.mediaLibraryItemStore.updateMediaLibraryItem(mediaLibraryItemId, newMediaLibraryItemMetadata);
  }

  async deleteMediaLibraryItem({ mediaLibraryItemId }) {
    const mediaLibraryItem = await this.mediaLibraryItemStore.getMediaLibraryItemById(mediaLibraryItemId);
    if (mediaLibraryItem) {
      await this.mediaLibraryItemStore.deleteMediaLibraryItem(mediaLibraryItemId);
      await this.cdn.deleteObject(getCdnPath({ url: mediaLibraryItem.url }));
    }
  }

  async getMediaLibraryItemTagsMatchingText(searchString) {
    const sanitizedSearchString = escapeStringRegexp((searchString || '').trim());
    const result = await this.mediaLibraryItemStore.getMediaLibraryItemTagsMatchingText(sanitizedSearchString);
    return result[0]?.uniqueTags || [];
  }
}

export default MediaLibraryService;
