import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';
import MediaLibraryService from '../services/media-library-service.js';

class IndexController {
  static dependencies = [SettingService, DocumentService, MediaLibraryService, PageRenderer];

  constructor(settingService, documentService, mediaLibraryService, pageRenderer) {
    this.settingService = settingService;
    this.documentService = documentService;
    this.mediaLibraryService = mediaLibraryService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetIndexPage(req, res) {
    const settings = await this.settingService.getAllSettings();
    const [tags, documentsCount, mediaItemsCount] = await Promise.all([
      settings.homepageTags?.length ? settings.homepageTags : this.documentService.getTopDocumentTags({ maxCount: 5 }),
      this.documentService.getSearchableDocumentsCount(),
      this.mediaLibraryService.getMediaLibraryItemsCount()
    ]);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.index, { tags, documentsCount, mediaItemsCount });
  }

  registerPages(router) {
    router.get(
      '/',
      (req, res) => this.handleGetIndexPage(req, res)
    );
  }
}

export default IndexController;
