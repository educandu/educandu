import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { BATCH_TYPE } from '../domain/constants.js';
import BatchService from '../services/batch-service.js';
import SettingService from '../services/setting-service.js';
import StorageService from '../services/storage-service.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class AdminController {
  static get inject() { return [SettingService, DocumentService, StorageService, BatchService, ClientDataMappingService, PageRenderer]; }

  constructor(settingService, documentService, storageService, batchService, clientDataMappingService, pageRenderer) {
    this.settingService = settingService;
    this.documentService = documentService;
    this.storageService = storageService;
    this.batchService = batchService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetAdminPage(req, res) {
    const { user } = req;

    const [
      settings,
      documents,
      storagePlans,
      lastDocumentRegenerationBatch,
      lastCdnResourcesConsolidationBatch
    ] = await Promise.all([
      this.settingService.getAllSettings(),
      this.documentService.getAllDocumentsMetadata(),
      this.storageService.getAllStoragePlansWithAssignedUserCount(),
      this.batchService.getLastBatch(BATCH_TYPE.documentRegeneration),
      this.batchService.getLastBatch(BATCH_TYPE.cdnResourcesConsolidation)
    ]);

    const initialState = {
      settings,
      documents: await this.clientDataMappingService.mapDocsOrRevisions(documents, user),
      storagePlans,
      lastDocumentRegenerationBatch: await this.clientDataMappingService.mapBatch(lastDocumentRegenerationBatch, user),
      lastCdnResourcesConsolidationBatch: await this.clientDataMappingService.mapBatch(lastCdnResourcesConsolidationBatch, user)
    };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.admin, initialState);
  }

  async handlePostDocumentRegenerationRequest(req, res) {
    const { user } = req;
    const batch = await this.batchService.createDocumentRegenerationBatch(user);

    return res.status(201).send(batch);
  }

  async handlePostCdnResourcesConsolidationRequest(req, res) {
    const { user } = req;
    const batch = await this.batchService.createCdnResourcesConsolidationBatch(user);

    return res.status(201).send(batch);
  }

  registerPages(router) {
    router.get(
      '/admin',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetAdminPage(req, res)
    );
  }

  registerApi(router) {
    router.post(
      '/api/v1/admin/document-regeneration',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handlePostDocumentRegenerationRequest(req, res)
    );

    router.post(
      '/api/v1/admin/cdn-resources-consolidation',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handlePostCdnResourcesConsolidationRequest(req, res)
    );
  }
}

export default AdminController;
