import by from 'thenby';
import mime from 'mime';
import moment from 'moment';
import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import cloneDeep from '../utils/clone-deep.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import SettingStore from '../stores/setting-store.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import transliterate from '@sindresorhus/transliterate';
import ServerConfig from '../bootstrap/server-config.js';
import { getResourceType } from '../utils/resource-utils.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { createTextSearchQuery } from '../utils/query-utils.js';
import MediaTrashItemStore from '../stores/media-trash-item-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import DocumentCategoryStore from '../stores/document-category-store.js';
import MediaLibraryItemStore from '../stores/media-library-item-store.js';
import { CDN_URL_PREFIX, DEFAULT_CONTENT_TYPE, RESOURCE_USAGE } from '../domain/constants.js';
import { createUniqueStorageFileName, getMediaLibraryPath, getMediaTrashPath } from '../utils/storage-utils.js';

const logger = new Logger(import.meta.url);

const { NotFound } = httpErrors;

class MediaLibraryService {
  static dependencies = [
    Cdn,
    MediaLibraryItemStore,
    DocumentCategoryStore,
    DocumentRevisionStore,
    MediaTrashItemStore,
    DocumentStore,
    UserStore,
    RoomStore,
    SettingStore,
    TransactionRunner,
    ServerConfig
  ];

  constructor(
    cdn,
    mediaLibraryItemStore,
    documentCategoryStore,
    documentRevisionStore,
    mediaTrashItemStore,
    documentStore,
    userStore,
    roomStore,
    settingStore,
    transactionRunner,
    serverConfig
  ) {
    this.cdn = cdn;
    this.mediaLibraryItemStore = mediaLibraryItemStore;
    this.documentCategoryStore = documentCategoryStore;
    this.documentRevisionStore = documentRevisionStore;
    this.mediaTrashItemStore = mediaTrashItemStore;
    this.documentStore = documentStore;
    this.userStore = userStore;
    this.roomStore = roomStore;
    this.settingStore = settingStore;
    this.transactionRunner = transactionRunner;
    this.serverConfig = serverConfig;
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
      usage: this._getMediaLibraryItemResourceUsage(
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

  async getAllMediaTrashItemsWithUsage() {
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
      this.mediaTrashItemStore.getAllMediaTrashItems(),
      this.documentStore.getAllCdnResourcesReferencedFromNonArchivedDocuments().then(x => new Set(x)),
      this.documentRevisionStore.getAllCdnResourcesReferencedFromDocumentRevisions().then(x => new Set(x)),
      this.documentCategoryStore.getAllCdnResourcesReferencedFromDocumentCategories().then(x => new Set(x)),
      this.userStore.getAllCdnResourcesReferencedFromUsers().then(x => new Set(x)),
      this.roomStore.getAllCdnResourcesReferencedFromRoomsMetadata().then(x => new Set(x)),
      this.settingStore.getAllCdnResourcesReferencedFromSettings().then(x => new Set(x)),
    ]);

    return items.map(item => ({
      ...item,
      expiresOn: moment(item.createdOn).add(this.serverConfig.mediaTrashExpiryTimeoutInDays, 'days').toDate(),
      usage: this._getMediaLibraryItemResourceUsage(
        item.originalItem,
        docCdnResources,
        revCdnResources,
        categoryResources,
        userCdnResources,
        roomCdnResources,
        settingCdnResources
      )
    }));
  }

  async getMediaLibraryItemUsageByName({ mediaLibraryItemName }) {
    await new Promise(resolve => {
      setTimeout(() => resolve(), 5000);
    });

    const storagePath = urlUtils.concatParts(getMediaLibraryPath(), mediaLibraryItemName);
    const cdnResourceName = `${CDN_URL_PREFIX}${storagePath}`;

    const [
      affectedFirstDocumentRevisions,
      documentCategories,
      users,
      rooms,
      settings
    ]
    = await Promise.all([
      this.documentRevisionStore.getFirstAffectedDocumentRevisionsPerDocumentByReferencedCdnResourceName(cdnResourceName),
      this.documentCategoryStore.getAllDocumentCategoriesByReferencedCdnResourceName(cdnResourceName),
      this.userStore.getAllUsersByReferencedCdnResourceName(cdnResourceName),
      this.roomStore.getAllRoomsByReferencedCdnResourceName(cdnResourceName),
      this.settingStore.getAllSettingsByReferencedCdnResourceName(cdnResourceName)
    ]);

    const affectedRoomIds = new Set();
    const affectedRoomDocumentIds = new Set();
    const affectedPublicDocumentIds = new Set();

    const archivedDocuments = [];
    const nonArchivedDocuments = [];
    const documentsWithHistoricUsageOnly = [];

    for (const revision of affectedFirstDocumentRevisions) {
      const resultDoc = {
        _id: revision.documentId,
        title: revision.documentTitle,
        slug: revision.documentSlug,
        firstAffectedRevisionId: revision._id,
        affectedRevisionCount: revision.affectedRevisionCount
      };

      if (revision.roomId) {
        affectedRoomIds.add(revision.roomId);
        affectedRoomDocumentIds.add(revision.documentId);
      } else{
        affectedPublicDocumentIds.add(revision.documentId);
        if (revision.isDocumentArchived) {
          archivedDocuments.push(resultDoc);
        } else if (revision.isResourceUsedInDocument) {
          nonArchivedDocuments.push(resultDoc);
        } else {
          documentsWithHistoricUsageOnly.push(resultDoc);
        }
      }
    }

    for (const room of rooms) {
      affectedRoomIds.add(room._id);
    }

    return {
      publicUsage: {
        nonArchivedDocuments,
        documentsWithHistoricUsageOnly,
        archivedDocuments,
        documentCategories,
        users,
        settingCount: settings.length,
        documentCount: affectedPublicDocumentIds.size
      },
      privateUsage: {
        roomContentCount: rooms.length,
        roomDocumentCount: affectedRoomDocumentIds.size,
        roomCount: affectedRoomIds.size
      }
    };
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

  async deleteMediaLibraryItem({ mediaLibraryItemId, user }) {
    const oldMediaLibraryItem = await this.mediaLibraryItemStore.getMediaLibraryItemWithSearchTokensById(mediaLibraryItemId);
    if (oldMediaLibraryItem) {
      const now = new Date();
      const newMediaTrashItemId = uniqueId.create();

      const oldStoragePath = urlUtils.concatParts(getMediaLibraryPath(), oldMediaLibraryItem.name);
      const newStoragePath = urlUtils.concatParts(getMediaTrashPath(), oldMediaLibraryItem.name);
      const newStorageUrl = `${CDN_URL_PREFIX}${newStoragePath}`;

      const newMediaTrashItem = {
        _id: newMediaTrashItemId,
        resourceType: oldMediaLibraryItem.resourceType,
        contentType: oldMediaLibraryItem.contentType,
        size: oldMediaLibraryItem.size,
        createdOn: now,
        createdBy: user._id,
        url: newStorageUrl,
        name: oldMediaLibraryItem.name,
        originalItem: cloneDeep(oldMediaLibraryItem)
      };

      await this.transactionRunner.run(async session => {
        await this.mediaTrashItemStore.insertMediaTrashItem(newMediaTrashItem, { session });
        await this.mediaLibraryItemStore.deleteMediaLibraryItem(mediaLibraryItemId, { session });
      });

      try {
        await this.cdn.moveObject(oldStoragePath, newStoragePath);
      } catch (error) {
        logger.error(`Error moving ${oldStoragePath} to ${newStoragePath} while deleting media library item with ID ${mediaLibraryItemId}`, error);
      }
    }
  }

  async deleteMediaTrashItem({ mediaTrashItemId }) {
    const itemToDelete = await this.mediaTrashItemStore.getMediaTrashItemMetadataById(mediaTrashItemId);
    if (itemToDelete) {
      await this._deleteMediaTrashItem(itemToDelete);
    }
  }

  async restoreMediaTrashItem({ mediaTrashItemId }) {
    const oldMediaTrashItem = await this.mediaTrashItemStore.getMediaTrashItemWithSearchTokensById(mediaTrashItemId);
    if (oldMediaTrashItem) {
      const newMediaLibraryItem = cloneDeep(oldMediaTrashItem.originalItem);

      const oldStoragePath = urlUtils.concatParts(getMediaTrashPath(), oldMediaTrashItem.name);
      const newStoragePath = urlUtils.concatParts(getMediaLibraryPath(), newMediaLibraryItem.name);

      await this.transactionRunner.run(async session => {
        await this.mediaLibraryItemStore.insertMediaLibraryItem(newMediaLibraryItem, { session });
        await this.mediaTrashItemStore.deleteMediaTrashItem(oldMediaTrashItem, { session });
      });

      try {
        await this.cdn.moveObject(oldStoragePath, newStoragePath);
      } catch (error) {
        logger.error(`Error moving ${oldStoragePath} to ${newStoragePath} while restoring media trash item with ID ${mediaTrashItemId}`, error);
      }
    }
  }

  async cleanupMediaTrash(context) {
    const now = new Date();
    const beforeDate = moment(now).add(this.serverConfig.mediaTrashExpiryTimeoutInDays, 'days').toDate();

    const itemsToDelete = await this.mediaTrashItemStore.getMediaTrashItemsMetadataCreatedBefore(beforeDate);
    if (!itemsToDelete.length) {
      logger.info('Cleaning up media trash: no items to delete');
      return;
    }

    for (const itemToDelete of itemsToDelete) {
      if (context.cancellationRequested) {
        logger.info('Cleaning up media trash has been cancelled');
        return;
      }

      await this._deleteMediaTrashItem(itemToDelete);
    }
  }

  async _deleteMediaTrashItem(itemToDelete) {
    const storagePath = urlUtils.concatParts(getMediaTrashPath(), itemToDelete.name);
    try {
      await this.cdn.deleteObject(storagePath);
      await this.mediaTrashItemStore.deleteMediaTrashItem(itemToDelete._id);
      logger.info(`Successfully deleted ${storagePath} and media trash item with ID ${itemToDelete._id}`);
    } catch (error) {
      logger.error(`Error deleting ${storagePath} and media trash item with ID ${itemToDelete._id}`, error);
    }
  }

  async bulkDeleteMediaLibraryItems({ mediaLibraryItemIds, user }) {
    for (const mediaLibraryItemId of mediaLibraryItemIds) {
      await this.deleteMediaLibraryItem({ mediaLibraryItemId, user });
    }
  }

  async getMediaLibraryItemTagsMatchingText(searchString) {
    const sanitizedSearchString = escapeStringRegexp((searchString || '').trim());
    const result = await this.mediaLibraryItemStore.getMediaLibraryItemTagsMatchingText(sanitizedSearchString);
    return result[0]?.uniqueTags || [];
  }

  _getMediaLibraryItemResourceUsage(
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
