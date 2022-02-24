import express from 'express';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { createImportBatchQuerySchema, getImportsQuerySchema, importBatchViewParamsSchema, postImportBatchBodySchema } from '../domain/schemas/import-schemas.js';

const { NotFound } = httpErrors;

const jsonParserLargePayload = express.json({ limit: '2MB' });

class ImportController {
  static get inject() { return [ServerConfig, PageRenderer, ImportService, ClientDataMappingService]; }

  constructor(serverConfig, pageRenderer, importService, clientDataMappingService) {
    this.serverConfig = serverConfig;
    this.importService = importService;
    this.pageRenderer = pageRenderer;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetImportBatchesPage(req, res) {
    const rawBatches = await this.importService.getImportBatches();
    const batches = await this.clientDataMappingService.mapImportBatches(rawBatches, req.user);
    const importSources = this.serverConfig.importSources.slice();

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.importBatches, { batches, importSources });
  }

  handleGetCreateImportBatchesPage(req, res) {
    const importSourceHostName = req.query.source;
    if (!this.serverConfig.importSources.some(source => source.hostName === importSourceHostName)) {
      throw new NotFound(`${importSourceHostName} is not a valid import source`);
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.importBatchCreation, { importSourceHostName });
  }

  async handleGetImportBatchPage(req, res) {
    const batchId = req.params.batchId;
    const rawBatch = await this.importService.getImportBatchDetails(batchId);
    if (!rawBatch) {
      throw new NotFound(`Batch with ID '${batchId}' could not be found`);
    }

    const batch = await this.clientDataMappingService.mapImportBatch(rawBatch, req.user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.importBatchView, { batch });
  }

  async handleGetImports(req, res) {
    const { hostName } = req.query;

    const importSource = this.serverConfig.importSources.find(source => source.hostName === hostName);
    if (!importSource) {
      throw new NotFound(`'${hostName}' is not a host name of a known import source`);
    }

    const documents = await this.importService.getAllImportableDocumentsMetadata(importSource);
    res.send({ documents });
  }

  async handleGetImportBatch(req, res) {
    const { batchId } = req.params;
    const rawBatch = await this.importService.getImportBatchDetails(batchId);
    const batch = await this.clientDataMappingService.mapImportBatch(rawBatch, req.user);

    res.send({ batch });
  }

  async handlePostImportBatch(req, res) {
    const { hostName, documentsToImport } = req.body;
    const user = req.user;

    const importSource = this.serverConfig.importSources.find(source => source.hostName === hostName);
    if (!importSource) {
      throw new NotFound(`'${hostName}' is not a host name of a known import source`);
    }

    const batch = await this.importService.createImportBatch({ importSource, documentsToImport, user });
    res.status(201).send({ batch });
  }

  registerPages(app) {
    app.get(
      '/import-batches',
      needsPermission(permissions.MANAGE_IMPORT),
      (req, res) => this.handleGetImportBatchesPage(req, res)
    );

    app.get(
      '/import-batches/create',
      [needsPermission(permissions.MANAGE_IMPORT), validateQuery(createImportBatchQuerySchema)],
      (req, res) => this.handleGetCreateImportBatchesPage(req, res)
    );

    app.get(
      '/import-batches/:batchId',
      [needsPermission(permissions.MANAGE_IMPORT), validateParams(importBatchViewParamsSchema)],
      (req, res) => this.handleGetImportBatchPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/imports',
      [needsPermission(permissions.MANAGE_IMPORT), validateQuery(getImportsQuerySchema)],
      (req, res) => this.handleGetImports(req, res)
    );

    router.get(
      '/api/v1/imports/batches/:batchId',
      [needsPermission(permissions.MANAGE_IMPORT)],
      (req, res) => this.handleGetImportBatch(req, res)
    );

    router.post(
      '/api/v1/imports/batches',
      [needsPermission(permissions.MANAGE_IMPORT), jsonParserLargePayload, validateBody(postImportBatchBodySchema)],
      (req, res) => this.handlePostImportBatch(req, res)
    );
  }
}

export default ImportController;
