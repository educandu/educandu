import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class IndexController {
  static get inject() { return [SettingService, DocumentService, ClientDataMappingService, PageRenderer]; }

  constructor(settingService, documentService, clientDataMappingService, pageRenderer) {
    this.settingService = settingService;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  handleGetIndexPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.index);
  }

  registerPages(router) {
    router.get(
      '/',
      (req, res) => this.handleGetIndexPage(req, res)
    );
  }
}

export default IndexController;
