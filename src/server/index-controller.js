import PageRenderer from './page-renderer.js';
import ClientDataMapper from './client-data-mapper.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';
import { PAGE_NAME } from '../domain/page-name.js';

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

  async handleGetIndexPage(req, res) {
    const { language } = req.query;
    const homeLanguages = req.settings?.homeLanguages || [];
    const currentHomeLanguageIndex = findHomeLanguageIndexForRequest(homeLanguages, language);
    if (currentHomeLanguageIndex <= 0 && language) {
      return res.redirect(302, '/');
    }

    const documentKey = req.settings?.homeLanguages?.[currentHomeLanguageIndex]?.documentKey || null;
    const doc = documentKey ? await this.documentService.getDocumentByKey(documentKey) : null;
    const document = doc ? await this.clientDataMapper.mapDocOrRevision(doc, req.user) : null;
    const initialState = { document, homeLanguages, currentHomeLanguageIndex };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.index, initialState);
  }

  registerPages(router) {
    router.get(
      '/',
      (req, res) => this.handleGetIndexPage(req, res)
    );
  }
}

export default IndexController;
