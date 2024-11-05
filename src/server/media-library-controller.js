import express from 'express';
import Cdn from '../stores/cdn.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import multipartMiddleware from '../domain/multipart-middleware.js';
import MediaLibraryService from '../services/media-library-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  mediaLibraryItemMetadataBodySchema,
  mediaLibraryItemIdParamsSchema,
  mediaLibrarySearchQuerySchema,
  mediaLibraryTagSearchQuerySchema,
  mediaLibraryFindParamsSchema,
  mediaLibraryBulkDeleteBodySchema
} from '../domain/schemas/media-library-item-schemas.js';

const jsonParser = express.json();

class MediaLibraryController {
  static dependencies = [MediaLibraryService, ClientDataMappingService, PageRenderer, Cdn];

  constructor(mediaLibraryService, clientDataMappingService, pageRenderer, cdn) {
    this.mediaLibraryService = mediaLibraryService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
    this.cdn = cdn;
  }

  async handleGetMediaLibraryItemPage(req, res) {
    const { user } = req;
    const { mediaLibraryItemId } = req.params;

    const mediaLibraryItem = await this.mediaLibraryService.getMediaLibraryItemById(mediaLibraryItemId);
    const mappedMediaLibraryItem = mediaLibraryItem ? await this.clientDataMappingService.mapMediaLibraryItem(mediaLibraryItem, user) : null;

    const initialState = { mediaLibraryItem: mappedMediaLibraryItem };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.mediaLibraryItem, initialState);
  }

  async handleQueryMediaLibraryItems(req, res) {
    const { user } = req;
    const { query, resourceTypes } = req.query;

    const splittedResourceTypes = resourceTypes.split(',');

    const mediaLibraryItems = await this.mediaLibraryService.getSearchableMediaLibraryItemsByTagsOrName({ query, resourceTypes: splittedResourceTypes });
    const mappedMediaLibraryItems = await this.clientDataMappingService.mapMediaLibraryItems(mediaLibraryItems, user);

    return res.send(mappedMediaLibraryItems);
  }

  async handleGetMediaLibraryItemsForContentManagement(req, res) {
    const { user } = req;

    const mediaLibraryItems = await this.mediaLibraryService.getAllMediaLibraryItemsWithUsage();
    const mappedMediaLibraryItems = await this.clientDataMappingService.mapMediaLibraryItems(mediaLibraryItems, user);

    return res.send({ mediaLibraryItems: mappedMediaLibraryItems });
  }

  async handleGetMediaLibraryItemsForStatistics(req, res) {
    const { user } = req;

    const mediaLibraryItems = await this.mediaLibraryService.getAllMediaLibraryItems();
    const mappedMediaLibraryItems = await this.clientDataMappingService.mapMediaLibraryItems(mediaLibraryItems, user);

    return res.send({ mediaLibraryItems: mappedMediaLibraryItems });
  }

  async handleFindMediaLibraryItemByUrl(req, res) {
    const { user } = req;
    const { url } = req.params;

    const mediaLibraryItem = await this.mediaLibraryService.getMediaLibraryItemByUrl({ url });
    const mappedMediaLibraryItem = mediaLibraryItem ? await this.clientDataMappingService.mapMediaLibraryItem(mediaLibraryItem, user) : null;

    return res.send(mappedMediaLibraryItem);
  }

  async handleCreateMediaLibraryItem(req, res) {
    const { user, file } = req;
    const { ...metadata } = req.body;

    const mediaLibraryItem = await this.mediaLibraryService.createMediaLibraryItem({ file, metadata, user });
    const mappedMediaLibraryItem = await this.clientDataMappingService.mapMediaLibraryItem(mediaLibraryItem, user);

    return res.status(201).send(mappedMediaLibraryItem);
  }

  async handleUpdateMediaLibraryItem(req, res) {
    const { user } = req;
    const data = req.body;
    const { mediaLibraryItemId } = req.params;

    const mediaLibraryItem = await this.mediaLibraryService.updateMediaLibraryItem({ mediaLibraryItemId, data, user });
    const mappedMediaLibraryItem = await this.clientDataMappingService.mapMediaLibraryItem(mediaLibraryItem, user);

    return res.send(mappedMediaLibraryItem);
  }

  async handleDeleteMediaLibraryItem(req, res) {
    const { mediaLibraryItemId } = req.params;

    await this.mediaLibraryService.deleteMediaLibraryItem({ mediaLibraryItemId });

    return res.status(204).end();
  }

  async handleBulkDeleteMediaLibraryItems(req, res) {
    const { mediaLibraryItemIds } = req.body;

    await this.mediaLibraryService.bulkDeleteMediaLibraryItems({ mediaLibraryItemIds });

    return res.status(204).end();
  }

  async handleGetMediaLibraryTagSuggestions(req, res) {
    const { query } = req.query;

    const mediaLibraryItemTags = await this.mediaLibraryService.getMediaLibraryItemTagsMatchingText(query);

    return res.send(mediaLibraryItemTags);
  }

  registerPages(router) {
    router.get(
      '/media-library/:mediaLibraryItemId',
      validateParams(mediaLibraryItemIdParamsSchema),
      (req, res) => this.handleGetMediaLibraryItemPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/media-library/items',
      needsPermission(permissions.BROWSE_STORAGE),
      validateQuery(mediaLibrarySearchQuerySchema),
      (req, res) => this.handleQueryMediaLibraryItems(req, res)
    );

    router.get(
      '/api/v1/media-library/items/content-management',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetMediaLibraryItemsForContentManagement(req, res)
    );

    router.get(
      '/api/v1/media-library/items/statistics',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetMediaLibraryItemsForStatistics(req, res)
    );

    router.get(
      '/api/v1/media-library/items/:url',
      needsPermission(permissions.BROWSE_STORAGE),
      validateParams(mediaLibraryFindParamsSchema),
      (req, res) => this.handleFindMediaLibraryItemByUrl(req, res)
    );

    router.post(
      '/api/v1/media-library/items',
      needsPermission(permissions.CREATE_CONTENT),
      multipartMiddleware({ cdn: this.cdn, fileField: 'file', bodyField: 'metadata', allowUnlimitedUploadForElevatedRoles: true }),
      validateBody(mediaLibraryItemMetadataBodySchema),
      (req, res) => this.handleCreateMediaLibraryItem(req, res)
    );

    router.patch(
      '/api/v1/media-library/items/:mediaLibraryItemId',
      jsonParser,
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(mediaLibraryItemIdParamsSchema),
      validateBody(mediaLibraryItemMetadataBodySchema),
      (req, res) => this.handleUpdateMediaLibraryItem(req, res)
    );

    router.delete(
      '/api/v1/media-library/items/:mediaLibraryItemId',
      needsPermission(permissions.DELETE_PUBLIC_CONTENT),
      validateParams(mediaLibraryItemIdParamsSchema),
      (req, res) => this.handleDeleteMediaLibraryItem(req, res)
    );

    router.delete(
      '/api/v1/media-library/items',
      jsonParser,
      needsPermission(permissions.DELETE_PUBLIC_CONTENT),
      validateBody(mediaLibraryBulkDeleteBodySchema),
      (req, res) => this.handleBulkDeleteMediaLibraryItems(req, res)
    );

    router.get(
      '/api/v1/media-library/tags',
      needsPermission(permissions.BROWSE_STORAGE),
      validateQuery(mediaLibraryTagSearchQuerySchema),
      (req, res) => this.handleGetMediaLibraryTagSuggestions(req, res)
    );
  }
}

export default MediaLibraryController;
