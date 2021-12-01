import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import ClientDataMapper from './client-data-mapper.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { validateBody, validateQuery } from '../domain/validation-middleware.js';
import {
  getRevisionsByKeyQuerySchema,
  createRevisionBodySchema,
  hardDeleteSectionBodySchema,
  restoreRevisionBodySchema,
  getSearchDocumentsByTagsSchema
} from '../domain/schemas/document-schemas.js';

const { NotFound } = httpErrors;

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });
const getDocumentsQueryFilter = user => ({ includeArchived: hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS) });

class DocumentController {
  static get inject() { return [DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(documentService, clientDataMapper, pageRenderer) {
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(router) {
    router.get('/articles/*', async (req, res) => {
      const slug = req.params[0] || '';
      const doc = await this.documentService.getDocumentByNamespaceAndSlug('articles', slug);
      if (!doc) {
        throw new NotFound();
      }

      const mappedDoc = await this.clientDataMapper.mapDocOrRevision(doc, req.user);
      return this.pageRenderer.sendPage(req, res, PAGE_NAME.article, { documentOrRevision: mappedDoc, type: 'document' });
    });

    router.get('/revs/articles/:id', (req, res) => {
      return res.redirect(301, urls.getDocumentRevisionUrl(req.params.id));
    });

    router.get('/revs/:id', async (req, res) => {
      const revision = await this.documentService.getDocumentRevisionById(req.params.id);
      if (!revision) {
        throw new NotFound();
      }

      const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
      return this.pageRenderer.sendPage(req, res, PAGE_NAME.article, { documentOrRevision: documentRevision, type: 'revision' });
    });

    router.get('/docs', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const allDocs = await this.documentService.getAllDocumentsMetadata(getDocumentsQueryFilter(req.user));
      const documents = await this.clientDataMapper.mapDocsOrRevisions(allDocs, req.user);

      return this.pageRenderer.sendPage(req, res, PAGE_NAME.docs, { documents });
    });

    router.get('/docs/:docKey', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const revisions = await this.documentService.getAllDocumentRevisionsByKey(req.params.docKey);
      if (!revisions.length) {
        throw new NotFound();
      }

      const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, req.user);
      return this.pageRenderer.sendPage(req, res, PAGE_NAME.doc, { documentRevisions });
    });

    router.get('/edit/doc/:docKey', needsPermission(permissions.EDIT_DOC), async (req, res) => {
      const revision = await this.documentService.getCurrentDocumentRevisionByKey(req.params.docKey);
      if (!revision) {
        throw new NotFound();
      }

      const { blueprintKey } = req.query;

      const blueprint = blueprintKey
        ? await this.documentService.getCurrentDocumentRevisionByKey(blueprintKey)
        : null;

      if (blueprintKey && !blueprint) {
        throw new NotFound();
      }

      if (blueprint && revision.sections.length) {
        return res.redirect(302, urls.getEditDocUrl(req.params.docKey));
      }

      const [documentRevision, blueprintRevision] = await this.clientDataMapper.mapDocsOrRevisions([revision, blueprint], req.user);
      const proposedSections = blueprintRevision ? this.clientDataMapper.createProposedSections(blueprintRevision) : null;
      return this.pageRenderer.sendPage(req, res, PAGE_NAME.editDoc, { documentRevision, proposedSections });
    });

    router.get('/search', validateQuery(getSearchDocumentsByTagsSchema), async (req, res) => {
      const { query } = req.query;
      const docs = await this.documentService.getDocumentsByTags(urls.decodeUrl(query));
      return this.pageRenderer.sendPage(req, res, PAGE_NAME.search, { docs });
    });
  }

  registerApi(router) {
    router.post('/api/v1/docs', [needsPermission(permissions.EDIT_DOC), jsonParserLargePayload, validateBody(createRevisionBodySchema)], async (req, res) => {
      const revision = await this.documentService.createDocumentRevision({ doc: req.body, user: req.user });
      if (!revision) {
        throw new NotFound();
      }

      const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
      return res.send({ documentRevision });
    });

    router.post('/api/v1/docs/restore-revision', [needsPermission(permissions.EDIT_DOC), jsonParser, validateBody(restoreRevisionBodySchema)], async (req, res) => {
      const { user } = req;
      const { documentKey, revisionId } = req.body;

      const revisions = await this.documentService.restoreDocumentRevision({ documentKey, revisionId, user });
      if (!revisions.length) {
        throw new NotFound();
      }

      const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, user);
      return res.send({ documentRevisions });
    });

    router.patch('/api/v1/docs/:key/archive', needsPermission(permissions.MANAGE_ARCHIVED_DOCS), async (req, res) => {
      const revision = await this.documentService.setArchivedState({ documentKey: req.params.key, user: req.user, archived: true });
      if (!revision) {
        throw new NotFound();
      }

      const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
      return res.send({ documentRevision });
    });

    router.patch('/api/v1/docs/:key/unarchive', needsPermission(permissions.MANAGE_ARCHIVED_DOCS), async (req, res) => {
      const revision = await this.documentService.setArchivedState({ documentKey: req.params.key, user: req.user, archived: false });
      if (!revision) {
        throw new NotFound();
      }

      const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
      return res.send({ documentRevision });
    });

    router.get('/api/v1/docs', [needsPermission(permissions.VIEW_DOCS), validateQuery(getRevisionsByKeyQuerySchema)], async (req, res) => {
      const { user } = req;
      const { key } = req.query;

      const revisions = await this.documentService.getAllDocumentRevisionsByKey(key);
      if (!revisions.length) {
        throw new NotFound();
      }

      const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, user);
      return res.send({ documentRevisions });
    });

    router.delete('/api/v1/docs/sections', [needsPermission(permissions.HARD_DELETE_SECTION), jsonParser, validateBody(hardDeleteSectionBodySchema)], async (req, res) => {
      const { user } = req;
      const { documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions } = req.body;
      const result = await this.documentService.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions, user });
      return res.send(result);
    });

    router.get('/api/v1/docs/revisions/tags/*', async (req, res) => {
      const query = req.params[0] || '';

      const result = await this.documentService.findRevisionTags(query);
      return res.send(result.length ? result[0].uniqueTags : []);
    });

    router.get('/api/v1/docs/tags/*', async (req, res) => {
      const query = req.params[0] || '';
      const result = await this.documentService.findDocumentTags(query);
      return res.send(result.length ? result[0].uniqueTags : []);
    });
  }
}

export default DocumentController;
