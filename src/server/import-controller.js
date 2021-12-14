import express from 'express';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import ClientDataMapper from './client-data-mapper.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { createImportBatchQuerySchema, getImportsQuerySchema, importBatchViewParamsSchema, postImportBatchBodySchema } from '../domain/schemas/import-schemas.js';

const { NotFound } = httpErrors;

const jsonParserLargePayload = express.json({ limit: '2MB' });

class ImportController {
  static get inject() { return [ServerConfig, PageRenderer, ImportService, ClientDataMapper]; }

  constructor(serverConfig, pageRenderer, importService, clientDataMapper) {
    this.serverConfig = serverConfig;
    this.importService = importService;
    this.pageRenderer = pageRenderer;
    this.clientDataMapper = clientDataMapper;
  }

  registerPages(app) {
    app.get('/import-batches', needsPermission(permissions.MANAGE_IMPORT), async (req, res) => {
      const rawBatches = await this.importService.getImportBatches();
      const batches = await this.clientDataMapper.mapImportBatches(rawBatches, req.user);
      const importSources = this.serverConfig.importSources.slice();

      return this.pageRenderer.sendPage(req, res, PAGE_NAME.importBatches, { batches, importSources });
    });

    app.get('/import-batches/create', [needsPermission(permissions.MANAGE_IMPORT), validateQuery(createImportBatchQuerySchema)], (req, res) => {
      const importSourceHostName = req.query.source;
      if (!this.serverConfig.importSources.some(source => source.hostName === importSourceHostName)) {
        throw new NotFound(`${importSourceHostName} is not a valid import source`);
      }

      return this.pageRenderer.sendPage(req, res, PAGE_NAME.importBatchCreation, { importSourceHostName });
    });

    app.get('/import-batches/:batchId', [needsPermission(permissions.MANAGE_IMPORT), validateParams(importBatchViewParamsSchema)], async (req, res) => {
      const batchId = req.params.batchId;
      const rawBatch = await this.importService.getImportBatchDetails(batchId);
      if (!rawBatch) {
        throw new NotFound(`Batch with ID '${batchId}' could not be found`);
      }

      const batch = await this.clientDataMapper.mapImportBatch(rawBatch, req.user);

      return this.pageRenderer.sendPage(req, res, PAGE_NAME.importBatchView, { batch });
    });
  }

  registerApi(router) {
    router.get('/api/v1/imports', [needsPermission(permissions.MANAGE_IMPORT), validateQuery(getImportsQuerySchema)], async (req, res) => {
      const { hostName } = req.query;

      const importSource = this.serverConfig.importSources.find(source => source.hostName === hostName);
      if (!importSource) {
        throw new NotFound(`'${hostName}' is not a host name of a known import source`);
      }

      const documents = await this.importService.getAllImportableDocumentsMetadata(importSource);
      res.send({ documents });
    });

    router.get('/api/v1/imports/batches/:batchId', [needsPermission(permissions.MANAGE_IMPORT)], async (req, res) => {
      const { batchId } = req.params;
      const rawBatch = await this.importService.getImportBatchDetails(batchId);
      const batch = await this.clientDataMapper.mapImportBatch(rawBatch, req.user);

      res.send({ batch });
    });

    router.post('/api/v1/imports/batches', [needsPermission(permissions.MANAGE_IMPORT), jsonParserLargePayload, validateBody(postImportBatchBodySchema)], async (req, res) => {
      const { hostName, documentsToImport } = req.body;
      const user = req.user;

      const importSource = this.serverConfig.importSources.find(source => source.hostName === hostName);
      if (!importSource) {
        throw new NotFound(`'${hostName}' is not a host name of a known import source`);
      }

      const batch = await this.importService.createImportBatch({ importSource, documentsToImport, user });
      res.send({ batch });
    });
  }
}

export default ImportController;
