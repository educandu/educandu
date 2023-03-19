import os from 'node:os';
import multer from 'multer';
import express from 'express';
import Cdn from '../stores/cdn.js';
import permissions from '../domain/permissions.js';
import MediaLibraryService from '../services/media-library-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import uploadLimitExceededMiddleware from '../domain/upload-limit-exceeded-middleware.js';
import { validateBody, validateFile, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  mediaLibraryItemMetadataBodySchema,
  mediaLibraryItemIdParamsSchema,
  mediaLibrarySearchQuerySchema,
  mediaLibraryTagSearchQuerySchema
} from '../domain/schemas/media-library-item-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

class MediaLibraryController {
  static dependencies = [Cdn, MediaLibraryService, ClientDataMappingService];

  constructor(cdn, mediaLibraryService, clientDataMappingService) {
    this.cdn = cdn;
    this.mediaLibraryService = mediaLibraryService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleQueryMediaLibraryItems(req, res) {
    const { user } = req;
    const { query, resourceTypes } = req.query;

    const splittedResourceTypes = resourceTypes.split(',');

    const mediaLibraryItems = await this.mediaLibraryService.getSearchableMediaLibraryItemsByTags({ query, resourceTypes: splittedResourceTypes });
    const mappedMediaLibraryItems = await this.clientDataMappingService.mapMediaLibraryItems(mediaLibraryItems, user);

    return res.send(mappedMediaLibraryItems);
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

  async handleGetMediaLibraryTagSuggestions(req, res) {
    const { query } = req.query;

    const mediaLibraryItemTags = await this.mediaLibraryService.getMediaLibraryItemTagsMatchingText(query);

    return res.send(mediaLibraryItemTags);
  }

  registerApi(router) {
    router.get(
      '/api/v1/media-library/items',
      needsPermission(permissions.BROWSE_STORAGE),
      validateQuery(mediaLibrarySearchQuerySchema),
      (req, res) => this.handleQueryMediaLibraryItems(req, res)
    );

    router.post(
      '/api/v1/media-library/items',
      needsPermission(permissions.CREATE_CONTENT),
      uploadLimitExceededMiddleware(),
      multipartParser.single('file'),
      validateFile('file'),
      (req, _res, next) => {
        // Multipart form data cannot transport "empty" arrays,
        // so in case no language was provided we have to set an empty array
        req.body.languages ||= [];
        next();
      },
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
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateParams(mediaLibraryItemIdParamsSchema),
      (req, res) => this.handleDeleteMediaLibraryItem(req, res)
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
