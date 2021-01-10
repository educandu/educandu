import PageRenderer from './page-renderer';
import ClientDataMapper from './client-data-mapper';
import SettingService from '../services/setting-service';
import DocumentService from '../services/document-service';

function findLandingPageLanguage(req) {
  const setting = req.settings.landingPage;

  if (!setting || !setting.languages) {
    return null;
  }

  if (setting.languages[req.language]) {
    return req.language;
  }

  if (setting.languages[setting.defaultLanguage]) {
    return setting.defaultLanguage;
  }

  return null;
}

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
      const lpLanguage = findLandingPageLanguage(req) || null;
      const documentKey = lpLanguage ? req.settings.landingPage.languages[lpLanguage].documentKey : null;
      const doc = documentKey ? await this.documentService.getDocumentByKey(documentKey) : null;
      const mappedDoc = doc ? await this.clientDataMapper.mapDocOrRevision(doc, req.user) : null;
      const initialState = { document: mappedDoc, landingPageLanguage: lpLanguage };
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'index', initialState);
    });
  }
}

export default IndexController;
