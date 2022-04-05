import express from 'express';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { BATCH_TYPE } from '../domain/constants.js';
import BatchService from '../services/batch-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery } from '../domain/validation-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { createImportQuerySchema, getImportsQuerySchema, postImportBodySchema } from '../domain/schemas/import-schemas.js';

const { NotFound } = httpErrors;

const jsonParserLargePayload = express.json({ limit: '2MB' });

class ImportController {
  static get inject() { return [ServerConfig, PageRenderer, ImportService, BatchService, ClientDataMappingService]; }

  constructor(serverConfig, pageRenderer, importService, batchService, clientDataMappingService) {
    this.serverConfig = serverConfig;
    this.importService = importService;
    this.batchService = batchService;
    this.pageRenderer = pageRenderer;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetImportsPage(req, res) {
    const rawBatches = await this.batchService.getBatchesWithProgress(BATCH_TYPE.documentImport);
    const batches = await this.clientDataMappingService.mapBatches(rawBatches, req.user);
    const importSources = this.serverConfig.importSources.slice();

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.imports, { batches, importSources });
  }

  handleGetCreateImportPage(req, res) {
    const importSourceHostName = req.query.source;
    if (!this.serverConfig.importSources.some(source => source.hostName === importSourceHostName)) {
      throw new NotFound(`${importSourceHostName} is not a valid import source`);
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.createImport, { importSourceHostName });
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

  async handlePostImport(req, res) {
    const { hostName, documentsToImport } = req.body;
    const user = req.user;

    const importSource = this.serverConfig.importSources.find(source => source.hostName === hostName);
    if (!importSource) {
      throw new NotFound(`'${hostName}' is not a host name of a known import source`);
    }

    const batch = await this.batchService.createImportBatch({ importSource, documentsToImport, user });
    res.status(201).send({ batch });
  }

  registerPages(app) {
    app.get(
      '/imports',
      needsPermission(permissions.MANAGE_IMPORT),
      (req, res) => this.handleGetImportsPage(req, res)
    );

    app.get(
      '/create-import',
      [needsPermission(permissions.MANAGE_IMPORT), validateQuery(createImportQuerySchema)],
      (req, res) => this.handleGetCreateImportPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/imports',
      [needsPermission(permissions.MANAGE_IMPORT), validateQuery(getImportsQuerySchema)],
      (req, res) => this.handleGetImports(req, res)
    );

    router.post(
      '/api/v1/imports',
      [needsPermission(permissions.MANAGE_IMPORT), jsonParserLargePayload, validateBody(postImportBodySchema)],
      (req, res) => this.handlePostImport(req, res)
    );
  }
}

export default ImportController;
