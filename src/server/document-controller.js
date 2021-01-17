import express from 'express';
import urls from '../utils/urls';
import { NotFound } from 'http-errors';
import PageRenderer from './page-renderer';
import permissions from '../domain/permissions';
import ClientDataMapper from './client-data-mapper';
import DocumentService from '../services/document-service';
import needsPermission from '../domain/needs-permission-middleware';

const jsonParser = express.json();

class DocumentController {
  static get inject() { return [DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(documentService, clientDataMapper, pageRenderer) {
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerPages(router) {
    router.get('/articles/:slug', async (req, res) => {
      const doc = await this.documentService.getDocumentByNamespaceAndSlug('articles', req.params.slug);
      if (!doc) {
        throw new NotFound();
      }

      const mappedDoc = await this.clientDataMapper.mapDocOrRevision(doc, req.user);
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'article', { documentOrRevision: mappedDoc, type: 'document' });
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
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'article', { documentOrRevision: documentRevision, type: 'revision' });
    });

    router.get('/docs', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const allDocs = await this.documentService.getAllDocumentsMetadata();
      const documents = await this.clientDataMapper.mapDocsOrRevisions(allDocs, req.user);

      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'docs', { documents });
    });

    router.get('/docs/:docKey', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const revisions = await this.documentService.getAllDocumentRevisionsByKey(req.params.docKey);
      if (!revisions.length) {
        throw new NotFound();
      }

      const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, req.user);
      return this.pageRenderer.sendPage(req, res, 'view-bundle', 'doc', { documentRevisions });
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
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'edit-doc', { documentRevision, proposedSections });
    });
  }

  registerApi(router) {
    router.post('/api/v1/docs', [needsPermission(permissions.EDIT_DOC), jsonParser], async (req, res) => {
      const revision = await this.documentService.createDocumentRevision({ data: req.body, user: req.user });
      if (!revision) {
        throw new NotFound();
      }

      const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
      return res.send({ documentRevision });
    });

    router.get('/api/v1/docs', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const { user } = req;

      const { key } = req.query;
      if (!key) {
        throw new NotFound();
      }

      const revisions = await this.documentService.getAllDocumentRevisionsByKey(key);
      if (!revisions.length) {
        throw new NotFound();
      }

      const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, user);
      return res.send({ documentRevisions });
    });

    router.delete('/api/v1/docs/sections', [needsPermission(permissions.EDIT_DOC), jsonParser], async (req, res) => {
      const { user } = req;
      const { documentKey, sectionKey, sectionRevision, reason, deleteDescendants } = req.body;
      const result = await this.documentService.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteDescendants, user });
      return res.send(result);
    });
  }
}

export default DocumentController;
