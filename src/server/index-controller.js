import PageRenderer from './page-renderer';
import privateData from '../domain/private-data';
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
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const lpDocId = await this.settingService.getLandingPageDocumentId();
      const doc = lpDocId ? await this.documentService.getDocumentById(lpDocId) : null;
      const initialState = this.clientDataMapper.mapDocToInitialState({ doc, allowedUserFields });
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'index', initialState);
    });
  }
}

export default IndexController;
