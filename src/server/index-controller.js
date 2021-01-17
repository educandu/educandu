import PageRenderer from './page-renderer';
import ClientDataMapper from './client-data-mapper';
import SettingService from '../services/setting-service';
import DocumentService from '../services/document-service';

function findHomeLanguageIndexForRequest(homeLanguages, languageFromQuerystring) {
  if (languageFromQuerystring) {
    return homeLanguages.findIndex(l => l.language === languageFromQuerystring);
  }

  return homeLanguages.length ? 0 : -1;
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
      const { language } = req.query;
      const { homeLanguages } = req.settings;
      const currentHomeLanguageIndex = findHomeLanguageIndexForRequest(homeLanguages, language);
      if (currentHomeLanguageIndex === 0 && language) {
        return res.redirect(302, '/');
      }

      const documentKey = req.settings.homeLanguages[currentHomeLanguageIndex]?.documentKey || null;
      const doc = documentKey ? await this.documentService.getDocumentByKey(documentKey) : null;
      const document = doc ? await this.clientDataMapper.mapDocOrRevision(doc, req.user) : null;
      const initialState = { document, homeLanguages, currentHomeLanguageIndex };
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'index', initialState);
    });
  }
}

export default IndexController;
