import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import DocumentService from '../services/document-service.js';
import { DOC_VIEW_QUERY_PARAM } from '../domain/constants.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  documentKeyParamsOrQuerySchema,
  documentMetadataBodySchema,
  hardDeleteSectionBodySchema,
  hardDeleteDocumentBodySchema,
  restoreRevisionBodySchema,
  getDocumentParamsSchema,
  getDocumentQuerySchema,
  patchDocSectionsBodySchema,
  createDocumentDataBodySchema,
  getDocumentsTitlesQuerySchema
} from '../domain/schemas/document-schemas.js';

const { NotFound } = httpErrors;

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });

class DocumentController {
  static get inject() { return [DocumentService, ClientDataMappingService, PageRenderer]; }

  constructor(documentService, clientDataMappingService, pageRenderer) {
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetDocsPage(req, res) {
    const includeArchived = hasUserPermission(req.user, permissions.MANAGE_ARCHIVED_DOCS);
    const allDocs = await this.documentService.getAllDocumentsMetadata({ includeArchived });
    const documents = await this.clientDataMappingService.mapDocsOrRevisions(allDocs, req.user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.docs, { documents });
  }

  async handleGetDocPage(req, res) {
    const { user } = req;
    const { docKey } = req.params;
    const { view, templateDocumentKey } = req.query;
    const routeWildcardValue = urlUtils.removeLeadingSlashes(req.params[0]);

    const doc = await this.documentService.getDocumentByKey(docKey);
    if (!doc) {
      throw new NotFound();
    }

    if (doc.slug !== routeWildcardValue) {
      return res.redirect(301, routes.getDocUrl({ key: doc.key, slug: doc.slug, view, templateDocumentKey }));
    }

    let templateDocument;
    if (templateDocumentKey) {
      if (doc.sections.length) {
        return res.redirect(302, routes.getDocUrl({ key: doc.key, slug: doc.slug }));
      }

      templateDocument = await this.documentService.getDocumentByKey(templateDocumentKey);
      if (!templateDocument) {
        throw new NotFound();
      }
    } else {
      templateDocument = null;
    }

    const [mappedDocument, mappedTemplateDocument] = await this.clientDataMappingService.mapDocsOrRevisions([doc, templateDocument], user);
    const templateSections = mappedTemplateDocument ? this.clientDataMappingService.createProposedSections(mappedTemplateDocument) : [];

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.doc, { doc: mappedDocument, templateSections });
  }

  async handlePostDocument(req, res) {
    const { user } = req;
    const data = req.body;

    const newDocument = await this.documentService.createDocument({ data, user });
    const mappedNewDocument = await this.clientDataMappingService.mapDocOrRevision(newDocument, user);
    return res.status(201).send(mappedNewDocument);
  }

  async handlePatchDocumentMetadata(req, res) {
    const { user } = req;
    const metadata = req.body;
    const { key: documentKey } = req.params;

    const updatedDocument = await this.documentService.updateDocumentMetadata({ documentKey, metadata, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentSections(req, res) {
    const { user } = req;
    const { sections } = req.body;
    const { key: documentKey } = req.params;

    const updatedDocument = await this.documentService.updateDocumentSections({ documentKey, sections, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentRestoreRevision(req, res) {
    const { user } = req;
    const { revisionId } = req.body;
    const { key: documentKey } = req.params;

    const documentRevisions = await this.documentService.restoreDocumentRevision({ documentKey, revisionId, user });
    if (!documentRevisions.length) {
      throw new NotFound();
    }

    const updatedDocument = await this.documentService.getDocumentByKey(documentKey);
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    const mappedDocumentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(documentRevisions, user);

    return res.status(201).send({ document: mappedDocument, documentRevisions: mappedDocumentRevisions });
  }

  async handlePatchDocArchive(req, res) {
    const revision = await this.documentService.updateArchivedState({ documentKey: req.params.key, user: req.user, archived: true });
    if (!revision) {
      throw new NotFound();
    }

    const documentRevision = await this.clientDataMappingService.mapDocOrRevision(revision, req.user);
    return res.send({ documentRevision });
  }

  async handlePatchDocUnarchive(req, res) {
    const revision = await this.documentService.updateArchivedState({ documentKey: req.params.key, user: req.user, archived: false });
    if (!revision) {
      throw new NotFound();
    }

    const documentRevision = await this.clientDataMappingService.mapDocOrRevision(revision, req.user);
    return res.send({ documentRevision });
  }

  async handleGetDocs(req, res) {
    const { user } = req;
    const { key } = req.query;

    const revisions = await this.documentService.getAllDocumentRevisionsByKey(key);
    if (!revisions.length) {
      throw new NotFound();
    }

    const documentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(revisions, user);
    return res.send({ documentRevisions });
  }

  async handleGetDoc(req, res) {
    const { user } = req;
    const { key } = req.params;

    const doc = await this.documentService.getDocumentByKey(key);
    if (!doc) {
      throw new NotFound();
    }

    const mappedDoc = await this.clientDataMappingService.mapDocOrRevision(doc, user);
    return res.send({ doc: mappedDoc });
  }

  async handleGetDocsMetadata(req, res) {
    const { user } = req;
    const { query } = req.query;

    const documentsMetadata = await this.documentService.findDocumentsMetadata(query);
    const mappedDocumentsMetadata = await this.clientDataMappingService.mapDocsOrRevisions(documentsMetadata, user);

    return res.send({ documents: mappedDocumentsMetadata });
  }

  async handleDeleteDocSection(req, res) {
    const { user } = req;
    const { documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions } = req.body;
    const document = await this.documentService.hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions, user });
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(document, req.user);
    return res.send({ document: mappedDocument });
  }

  async handleDeleteDoc(req, res) {
    const { documentKey } = req.body;
    await this.documentService.hardDeleteDocument(documentKey);
    return res.send({});
  }

  async handleGetDocTags(req, res) {
    const searchString = req.params[0] || '';

    const result = await this.documentService.getDocumentTagsMatchingText(searchString);
    return res.send(result.length ? result[0].uniqueTags : []);
  }

  registerPages(router) {
    router.get(
      '/docs',
      needsPermission(permissions.VIEW_DOCS),
      (req, res) => this.handleGetDocsPage(req, res)
    );

    router.get(
      '/docs/:docKey*',
      validateParams(getDocumentParamsSchema),
      validateQuery(getDocumentQuerySchema),
      needsPermission({
        value: permissions.EDIT_DOC,
        condition: req => Object.values(DOC_VIEW_QUERY_PARAM).includes(req.query.view)
      }),
      (req, res) => this.handleGetDocPage(req, res)
    );
  }

  registerApi(router) {
    router.post(
      '/api/v1/docs',
      jsonParserLargePayload,
      needsPermission(permissions.EDIT_DOC),
      validateBody(createDocumentDataBodySchema),
      (req, res) => this.handlePostDocument(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/metadata',
      jsonParser,
      needsPermission(permissions.EDIT_DOC),
      validateParams(documentKeyParamsOrQuerySchema),
      validateBody(documentMetadataBodySchema),
      (req, res) => this.handlePatchDocumentMetadata(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/sections',
      jsonParserLargePayload,
      needsPermission(permissions.EDIT_DOC),
      validateParams(documentKeyParamsOrQuerySchema),
      validateBody(patchDocSectionsBodySchema),
      (req, res) => this.handlePatchDocumentSections(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/restore',
      jsonParser,
      needsPermission(permissions.EDIT_DOC),
      validateParams(documentKeyParamsOrQuerySchema),
      validateBody(restoreRevisionBodySchema),
      (req, res) => this.handlePatchDocumentRestoreRevision(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/archive',
      [needsPermission(permissions.MANAGE_ARCHIVED_DOCS), validateParams(documentKeyParamsOrQuerySchema)],
      (req, res) => this.handlePatchDocArchive(req, res)
    );

    router.patch(
      '/api/v1/docs/:key/unarchive',
      [needsPermission(permissions.MANAGE_ARCHIVED_DOCS), validateParams(documentKeyParamsOrQuerySchema)],
      (req, res) => this.handlePatchDocUnarchive(req, res)
    );

    router.get(
      '/api/v1/docs',
      [needsPermission(permissions.VIEW_DOCS), validateQuery(documentKeyParamsOrQuerySchema)],
      (req, res) => this.handleGetDocs(req, res)
    );

    router.get(
      '/api/v1/docs/metadata',
      [needsPermission(permissions.VIEW_DOCS), validateQuery(getDocumentsTitlesQuerySchema)],
      (req, res) => this.handleGetDocsMetadata(req, res)
    );

    router.get(
      '/api/v1/docs/:key',
      [needsPermission(permissions.VIEW_DOCS), validateParams(documentKeyParamsOrQuerySchema)],
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
      '/api/v1/docs/tags/*',
      (req, res) => this.handleGetDocTags(req, res)
    );
  }
}

export default DocumentController;
