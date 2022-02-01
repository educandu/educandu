import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import ClientDataMapper from './client-data-mapper.js';
import DocumentService from '../services/document-service.js';
import { DOCUMENT_TYPE, DOC_VIEW } from '../domain/constants.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  getDocByKeyParamsSchema,
  getRevisionsByKeyQuerySchema,
  createRevisionBodySchema,
  hardDeleteSectionBodySchema,
  hardDeleteDocumentBodySchema,
  restoreRevisionBodySchema,
  getDocumentParamsSchema,
  getDocumentQuerySchema
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

  handleGetArticlePage(req, res) {
    res.redirect(301, urls.getDocumentRevisionUrl(req.params.id));
  }

  async handleGetRevisionPage(req, res) {
    const revision = await this.documentService.getDocumentRevisionById(req.params.id);
    if (!revision) {
      throw new NotFound();
    }

    const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.doc, { currentDocOrRevision: documentRevision, type: DOCUMENT_TYPE.permalinkedRevision });
  }

  async handleGetDocsPage(req, res) {
    const allDocs = await this.documentService.getAllDocumentsMetadata(getDocumentsQueryFilter(req.user));
    const documents = await this.clientDataMapper.mapDocsOrRevisions(allDocs, req.user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.docs, { documents });
  }

  async handleGetDocPage(req, res) {
    const { user } = req;
    const { docKey } = req.params;
    const { view, templateDocumentKey } = req.query;
    const routeWildcardValue = urls.removeLeadingSlash(req.params[0]);

    const doc = await this.documentService.getDocumentByKey(docKey);
    if (!doc) {
      throw new NotFound();
    }

    if (doc.slug !== routeWildcardValue) {
      return res.redirect(301, urls.getDocUrl({ key: doc.key, slug: doc.slug, view, templateDocumentKey }));
    }

    const templateDocument = templateDocumentKey
      ? await this.documentService.getDocumentByKey(templateDocumentKey)
      : null;

    if (templateDocumentKey && !templateDocument) {
      throw new NotFound();
    }

    if (templateDocument && doc.sections.length) {
      return res.redirect(302, urls.getDocUrl({ key: doc.key, slug: doc.slug }));
    }

    let mappedLatestRevision = null;
    if (view === DOC_VIEW.edit) {
      const latestRevision = await this.documentService.getDocumentRevisionById(doc.revision);
      mappedLatestRevision = await this.clientDataMapper.mapDocOrRevision(latestRevision, user);
    }

    const [mappedDocument, mappedTemplateDocument] = await this.clientDataMapper.mapDocsOrRevisions([doc, templateDocument], user);
    const templateSections = mappedTemplateDocument ? this.clientDataMapper.createProposedSections(mappedTemplateDocument) : [];

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.doc, { doc: mappedDocument, latestRevision: mappedLatestRevision, templateSections });
  }

  async handlePostDoc(req, res) {
    const revision = await this.documentService.createNewDocumentRevision({ doc: req.body, user: req.user });
    if (!revision) {
      throw new NotFound();
    }

    const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
    return res.send({ documentRevision });
  }

  async handlePostDocRestoreRevision(req, res) {
    const { user } = req;
    const { documentKey, revisionId } = req.body;

    const revisions = await this.documentService.restoreDocumentRevision({ documentKey, revisionId, user });
    if (!revisions.length) {
      throw new NotFound();
    }

    const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, user);
    return res.send({ documentRevisions });
  }

  async handlePatchDocArchive(req, res) {
    const revision = await this.documentService.setArchivedState({ documentKey: req.params.key, user: req.user, archived: true });
    if (!revision) {
      throw new NotFound();
    }

    const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
    return res.send({ documentRevision });
  }

  async handlePatchDocUnarchive(req, res) {
    const revision = await this.documentService.setArchivedState({ documentKey: req.params.key, user: req.user, archived: false });
    if (!revision) {
      throw new NotFound();
    }

    const documentRevision = await this.clientDataMapper.mapDocOrRevision(revision, req.user);
    return res.send({ documentRevision });
  }

  async handleGetDocs(req, res) {
    const { user } = req;
    const { key } = req.query;

    const revisions = await this.documentService.getAllDocumentRevisionsByKey(key);
    if (!revisions.length) {
      throw new NotFound();
    }

    const documentRevisions = await this.clientDataMapper.mapDocsOrRevisions(revisions, user);
    return res.send({ documentRevisions });
  }

  async handleGetDoc(req, res) {
    const { user } = req;
    const { key } = req.params;

    const doc = await this.documentService.getDocumentByKey(key);
    if (!doc) {
      throw new NotFound();
    }

    const mappedDoc = await this.clientDataMapper.mapDocOrRevision(doc, user);
    return res.send({ doc: mappedDoc });
  }

  async handleDeleteDocSection(req, res) {
    const { user } = req;
    const { documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions } = req.body;
    const result = await this.documentService.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions, user });
    return res.send(result);
  }

  async handleDeleteDoc(req, res) {
    const { documentKey } = req.body;
    const result = await this.documentService.hardDeleteDocument(documentKey);
    return res.send(result);
  }

  async handleGetDocRevisionTags(req, res) {
    const searchString = req.params[0] || '';

    const result = await this.documentService.findRevisionTags(searchString);
    return res.send(result.length ? result[0].uniqueTags : []);
  }

  async handleGetDocTags(req, res) {
    const searchString = req.params[0] || '';
    const result = await this.documentService.findDocumentTags(searchString);
    return res.send(result.length ? result[0].uniqueTags : []);
  }

  async handlePostDocumentRegenerationBatch(req, res) {
    const { user } = req;
    const batch = await this.documentService.createDocumentRegenerationBatch(user);

    return res.status(201).send(batch);
  }

  registerPages(router) {
    router.get(
      '/revs/articles/:id',
      (req, res) => this.handleGetArticlePage(req, res)
    );

    router.get(
      '/revs/:id',
      (req, res) => this.handleGetRevisionPage(req, res)
    );

    router.get(
      '/docs',
      needsPermission(permissions.VIEW_DOCS),
      (req, res) => this.handleGetDocsPage(req, res)
    );

    router.get(
      '/docs/:docKey*',
      [validateParams(getDocumentParamsSchema), validateQuery(getDocumentQuerySchema)],
      (req, res) => this.handleGetDocPage(req, res)
    );
  }

  registerApi(router) {
    router.post(
      '/api/v1/docs',
      [needsPermission(permissions.EDIT_DOC), jsonParserLargePayload, validateBody(createRevisionBodySchema)],
      (req, res) => this.handlePostDoc(req, res)
    );

    router.post(
      '/api/v1/docs/restore-revision',
      [needsPermission(permissions.EDIT_DOC), jsonParser, validateBody(restoreRevisionBodySchema)],
      (req, res) => this.handlePostDocRestoreRevision(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/archive',
      needsPermission(permissions.MANAGE_ARCHIVED_DOCS),
      (req, res) => this.handlePatchDocArchive(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/unarchive',
      needsPermission(permissions.MANAGE_ARCHIVED_DOCS),
      (req, res) => this.handlePatchDocUnarchive(req, res)
    );

    router.get(
      '/api/v1/docs',
      [needsPermission(permissions.VIEW_DOCS), validateQuery(getRevisionsByKeyQuerySchema)],
      (req, res) => this.handleGetDocs(req, res)
    );

    router.get(
      '/api/v1/docs/:key',
      [needsPermission(permissions.VIEW_DOCS), validateParams(getDocByKeyParamsSchema)],
      (req, res) => this.handleGetDoc(req, res)
    );

    router.delete(
      '/api/v1/docs/sections',
      [needsPermission(permissions.HARD_DELETE_SECTION), jsonParser, validateBody(hardDeleteSectionBodySchema)],
      (req, res) => this.handleDeleteDocSection(req, res)
    );

    router.delete(
      '/api/v1/docs',
      [needsPermission(permissions.MANAGE_IMPORT), jsonParser, validateBody(hardDeleteDocumentBodySchema)],
      (req, res) => this.handleDeleteDoc(req, res)
    );

    router.get(
      '/api/v1/docs/revisions/tags/*',
      (req, res) => this.handleGetDocRevisionTags(req, res)
    );

    router.get(
      '/api/v1/docs/tags/*',
      (req, res) => this.handleGetDocTags(req, res)
    );

    router.post(
      '/api/v1/docs/document-regeneration-batch',
      [needsPermission(permissions.REGENERATE_DOCS)],
      (req, res) => this.handlePostDocumentRegenerationBatch(req, res)
    );
  }
}

export default DocumentController;
