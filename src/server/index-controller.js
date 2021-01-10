import PageRenderer from './page-renderer';
import ClientDataMapper from './client-data-mapper';
import SettingService from '../services/setting-service';
import DocumentService from '../services/document-service';

class IndexController {
  static get inject() { return [SettingService, DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(settingService, documentService, clientDataMapper, pageRenderer) {
    this.settingService = settingService;
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(router) {
    router.get('/', async (req, res) => {
      const setting = await this.settingService.getLandingPage();
      const lpDocId = setting ? setting.documentKeys[setting.defaultLanguage] : null;
      const doc = lpDocId ? await this.documentService.getDocumentByKey(lpDocId) : null;
      const mappedDoc = doc ? await this.clientDataMapper.mapDocOrRevision(doc, req.user) : null;
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'index', { document: mappedDoc });
    });
  }
}

export default IndexController;
