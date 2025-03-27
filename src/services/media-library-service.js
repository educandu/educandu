import by from 'thenby';
import mime from 'mime';
import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import SettingStore from '../stores/setting-store.js';
import { getCdnPath } from '../utils/source-utils.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import transliterate from '@sindresorhus/transliterate';
import { getResourceType } from '../utils/resource-utils.js';
import { createTextSearchQuery } from '../utils/query-utils.js';
import DocumentCategoryStore from '../stores/document-category-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';
import { createUniqueStorageFileName, getMediaLibraryPath } from '../utils/storage-utils.js';
import { CDN_URL_PREFIX, DEFAULT_CONTENT_TYPE, RESOURCE_USAGE } from '../domain/constants.js';

const { NotFound } = httpErrors;

class MediaLibraryService {
  static dependencies = [
    Cdn,
    MediaLibraryItemStore,
    DocumentCategoryStore,
    DocumentRevisionStore,
    DocumentStore,
    UserStore,
    RoomStore,
    SettingStore
  ];

  constructor(
    cdn,
    mediaLibraryItemStore,
    documentCategoryStore,
    documentRevisionStore,
    documentStore,
    userStore,
    roomStore,
    settingStore
  ) {
    this.cdn = cdn;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
    this.documentCategoryStore = documentCategoryStore;
    this.documentRevisionStore = documentRevisionStore;
    this.documentStore = documentStore;
    this.userStore = userStore;
    this.roomStore = roomStore;
    this.settingStore = settingStore;
  }

  getAllMediaLibraryItems() {
    return this.mediaLibraryItemStore.getAllMediaLibraryItems();
  }

  async getAllMediaLibraryItemsWithUsage() {
    const [
      items,
      docCdnResources,
      revCdnResources,
      categoryResources,
      userCdnResources,
      roomCdnResources,
      settingCdnResources
    ]
    = await Promise.all([
      this.mediaLibraryItemStore.getAllMediaLibraryItems(),
      this.documentStore.getAllCdnResourcesReferencedFromNonArchivedDocuments().then(x => new Set(x)),
      this.documentRevisionStore.getAllCdnResourcesReferencedFromDocumentRevisions().then(x => new Set(x)),
      this.documentCategoryStore.getAllCdnResourcesReferencedFromDocumentCategories().then(x => new Set(x)),
      this.userStore.getAllCdnResourcesReferencedFromUsers().then(x => new Set(x)),
      this.roomStore.getAllCdnResourcesReferencedFromRoomsMetadata().then(x => new Set(x)),
      this.settingStore.getAllCdnResourcesReferencedFromSettings().then(x => new Set(x)),
    ]);

    return items.map(item => ({
      ...item,
      usage: this._getResourceUsage(
        item,
        docCdnResources,
        revCdnResources,
        categoryResources,
        userCdnResources,
        roomCdnResources,
        settingCdnResources
      )
    }));
  }

  async getMediaLibraryItemsCount() {
    const count = await this.mediaLibraryItemStore.getMediaLibraryItemsCount();
    return count;
  }

  async getSearchableMediaLibraryItems({ query, resourceTypes = null }) {
    const textQuery = createTextSearchQuery(query, 'searchTokens');
    if (!textQuery.isValid) {
      return [];
    }

    const textAndResourceTypeQueryConditions = [textQuery.query];
    if (resourceTypes) {
      textAndResourceTypeQueryConditions.push({ resourceType: { $in: resourceTypes } });
    }

    const mediaLibraryItems = await this.mediaLibraryItemStore.getMediaLibraryItemsWithSearchTokensByConditions(textAndResourceTypeQueryConditions);

    const itemsWithRelevance = mediaLibraryItems
      .map(item => {
        const exactTokenMatchCount = item.searchTokens.filter(searchToken => textQuery.positiveTokens.has(searchToken.toLowerCase())).length;
        delete item.searchTokens;
        return { ...item, relevance: exactTokenMatchCount };
      })
      .sort(by(item => item.relevance).thenBy(item => item.name));

    return itemsWithRelevance;
  }

  async getMediaLibraryItemByUrl({ url }) {
    const mediaLibraryItem = await this.mediaLibraryItemStore.getMediaLibraryItemByUrl(url);
    return mediaLibraryItem || null;
  }

  async getMediaLibraryItemById(mediaLibraryItemId) {
    const mediaLibraryItem = await this.mediaLibraryItemStore.getMediaLibraryItemById(mediaLibraryItemId);
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
      allRightsReserved: metadata.allRightsReserved,
      licenses: metadata.licenses,
      tags: metadata.tags,
      searchTokens: [...metadata.tags.map(tag => transliterate(tag)), transliterate(storageFileName)]
    };

    try {
      await this.cdn.moveObject(file.key, storagePath);
      return this.mediaLibraryItemStore.insertMediaLibraryItem(newMediaLibraryItem);
    } catch (error) {
      await this.cdn.deleteObject(storagePath);
      throw error;
    }
  }

  async updateMediaLibraryItem({ mediaLibraryItemId, data, user }) {
    const mediaLibraryItem = await this.mediaLibraryItemStore.getMediaLibraryItemById(mediaLibraryItemId);
    if (!mediaLibraryItem) {
      throw new NotFound();
    }

    const now = new Date();

    const newMediaLibraryItemMetadata = {
      updatedBy: user._id,
      updatedOn: now,
      shortDescription: data.shortDescription,
      languages: data.languages,
      allRightsReserved: data.allRightsReserved,
      licenses: data.licenses,
      tags: data.tags,
      searchTokens: [...data.tags.map(tag => transliterate(tag)), transliterate(mediaLibraryItem.name)]
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

  async bulkDeleteMediaLibraryItems({ mediaLibraryItemIds }) {
    for (const mediaLibraryItemId of mediaLibraryItemIds) {
      await this.deleteMediaLibraryItem({ mediaLibraryItemId });
    }
  }

  async getMediaLibraryItemTagsMatchingText(searchString) {
    const sanitizedSearchString = escapeStringRegexp((searchString || '').trim());
    const result = await this.mediaLibraryItemStore.getMediaLibraryItemTagsMatchingText(sanitizedSearchString);
    return result[0]?.uniqueTags || [];
  }

  _getResourceUsage(
    mediaLibraryItem,
    documentCdnResourcesSet,
    documentRevisionsCdnResourcesSet,
    documentCategoryResourcesSet,
    userCdnResourcesSet,
    roomCdnResourcesSet,
    settingCdnResourcesSet
  ) {
    if (
      documentCdnResourcesSet.has(mediaLibraryItem.url)
      || documentCategoryResourcesSet.has(mediaLibraryItem.url)
      || userCdnResourcesSet.has(mediaLibraryItem.url)
      || roomCdnResourcesSet.has(mediaLibraryItem.url)
      || settingCdnResourcesSet.has(mediaLibraryItem.url)
    ) {
      return RESOURCE_USAGE.used;
    }

    if (documentRevisionsCdnResourcesSet.has(mediaLibraryItem.url)) {
      return RESOURCE_USAGE.deprecated;
    }

    return RESOURCE_USAGE.unused;
  }
}

export default MediaLibraryService;
