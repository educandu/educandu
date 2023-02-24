import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';

class IndexController {
  static dependencies = [SettingService, DocumentService, PageRenderer];

  constructor(settingService, documentService, pageRenderer) {
    this.settingService = settingService;
    this.documentService = documentService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetIndexPage(req, res) {
    const settings = await this.settingService.getAllSettings();
    const tags = settings.homepageTags?.length ? settings.homepageTags : await this.documentService.getTopDocumentTags({ maxCount: 5 });

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.index, { tags });
  }

  registerPages(router) {
    router.get(
      '/',
      (req, res) => this.handleGetIndexPage(req, res)
    );
  }
}

export default IndexController;
