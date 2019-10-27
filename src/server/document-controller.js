const parseBool = require('parseboolean');
const bodyParser = require('body-parser');
const { NotFound } = require('http-errors');
const PageRenderer = require('./page-renderer');
const permissions = require('../domain/permissions');
const privateData = require('../domain/private-data');
const ClientDataMapper = require('./client-data-mapper');
const DocumentService = require('../services/document-service');
const needsPermission = require('../domain/needs-permission-middleware');

const jsonParser = bodyParser.json();

class DocumentController {
  static get inject() { return [DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(documentService, clientDataMapper, pageRenderer) {
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(router) {
    router.get('/articles/:slug', async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const doc = await this.documentService.getDocumentBySlug(req.params.slug);
      if (!doc) {
        throw new NotFound();
      }

      const initialState = this.clientDataMapper.mapDocToInitialState({ doc, allowedUserFields });
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'article', initialState);
    });

    router.get('/revs/articles/:revId', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const doc = await this.documentService.getDocumentRevision(req.params.revId);
      if (!doc) {
        throw new NotFound();
      }

      const initialState = this.clientDataMapper.mapDocToInitialState({ doc, allowedUserFields });
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'article', initialState);
    });

    router.get('/docs', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const docs = await this.documentService.getDocumentsMetadata();
      const initialState = this.clientDataMapper.mapDocMetadataToInitialState({ docs, allowedUserFields });

      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'docs', initialState);
    });

    router.get('/docs/:docId', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const docs = await this.documentService.getDocumentHistory(req.params.docId);
      if (!docs.length) {
        throw new NotFound();
      }

      const initialState = this.clientDataMapper.mapDocHistoryToInitialState({ docs, allowedUserFields });
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'doc', initialState);
    });

    router.get('/edit/doc/:docId', needsPermission(permissions.EDIT_DOC), async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        throw new NotFound();
      }

      const initialState = this.clientDataMapper.mapDocToInitialState({ doc, allowedUserFields });
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'edit-doc', initialState);
    });
  }

  registerApi(router) {
    router.post('/api/v1/docs', [needsPermission(permissions.EDIT_DOC), jsonParser], async (req, res) => {
      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const { user } = req;
      const { doc, sections } = req.body;
      const docRevision = await this.documentService.createDocumentRevision({ doc, sections, user });
      const initialState = this.clientDataMapper.mapDocToInitialState({ doc: docRevision, allowedUserFields: allowedUserFields });
      return res.send(initialState);
    });

    router.get('/api/v1/docs/:docId', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const fullHistory = parseBool(req.query.fullHistory);
      if (!fullHistory) {
        throw new NotFound();
      }

      const allowedUserFields = privateData.getAllowedUserFields(req.user);

      const docs = await this.documentService.getDocumentHistory(req.params.docId);
      if (!docs.length) {
        throw new NotFound();
      }

      const initialState = this.clientDataMapper.mapDocHistoryToInitialState({ docs, allowedUserFields });
      return res.send(initialState);
    });

    router.delete('/api/v1/docs/sections', [needsPermission(permissions.EDIT_DOC), jsonParser], async (req, res) => {
      const { user } = req;
      const { key, order, reason, deleteDescendants } = req.body;
      const result = await this.documentService.hardDeleteSection({ key, order, reason, deleteDescendants, user });
      return res.send(result);
    });
  }
}

module.exports = DocumentController;
