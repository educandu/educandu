import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import { canEditDocContent } from '../utils/doc-utils.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { isRoomOwnerOrCollaborator, isRoomOwnerOrMember } from '../utils/room-utils.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { DOCUMENT_ORIGIN, DOC_VIEW_QUERY_PARAM, NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE } from '../domain/constants.js';
import {
  documentIdParamsOrQuerySchema,
  documentMetadataBodySchema,
  hardDeleteSectionBodySchema,
  hardDeleteDocumentBodySchema,
  restoreRevisionBodySchema,
  getDocumentParamsSchema,
  getDocumentQuerySchema,
  patchDocSectionsBodySchema,
  createDocumentDataBodySchema,
  getSearchableDocumentsTitlesQuerySchema
} from '../domain/schemas/document-schemas.js';

const { NotFound, BadRequest, Forbidden, Unauthorized } = httpErrors;

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });

class DocumentController {
  static get inject() { return [DocumentService, RoomService, ClientDataMappingService, PageRenderer]; }

  constructor(documentService, roomService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetDocsPage(req, res) {
    const includeArchived = hasUserPermission(req.user, permissions.MANAGE_ARCHIVED_DOCS);
    const documents = await this.documentService.getAllPublicDocumentsMetadata({ includeArchived });

    const mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(documents, req.user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.docs, { documents: mappedDocuments });
  }

  async handleGetDocPage(req, res) {
    const { user } = req;
    const { documentId } = req.params;
    const { view, templateDocumentId } = req.query;
    const routeWildcardValue = urlUtils.removeLeadingSlashes(req.params[0]);

    const doc = await this.documentService.getDocumentById(documentId);
    if (!doc) {
      throw new NotFound();
    }

    if (doc.slug !== routeWildcardValue) {
      return res.redirect(301, routes.getDocUrl({ id: doc._id, slug: doc.slug, view, templateDocumentId }));
    }

    let templateDocument;
    if (templateDocumentId) {
      if (doc.sections.length) {
        return res.redirect(302, routes.getDocUrl({ id: doc._id, slug: doc.slug }));
      }

      templateDocument = await this.documentService.getDocumentById(templateDocumentId);
      if (!templateDocument) {
        throw new NotFound();
      }

      if (templateDocument.roomId) {
        if (!user) {
          throw new Unauthorized();
        }

        const templateDocumentRoom = await this.roomService.getRoomById(templateDocument.roomId);

        if (!isRoomOwnerOrMember({ room: templateDocumentRoom, userId: user._id })) {
          throw new Forbidden();
        }
      }
    } else {
      templateDocument = null;
    }

    let room;
    if (doc.roomId) {
      if (!user) {
        throw new Unauthorized();
      }

      room = await this.roomService.getRoomById(doc.roomId);

      if (!isRoomOwnerOrMember({ room, userId: user._id })) {
        throw new Forbidden();
      }
    } else {
      room = null;
    }

    if (view === DOC_VIEW_QUERY_PARAM.edit && !canEditDocContent({ user, doc, room })) {
      return res.redirect(routes.getDocUrl({ id: doc._id, slug: doc.slug }));
    }

    const mappedRoom = room ? await this.clientDataMappingService.mapRoom(room, user) : null;
    const [mappedDocument, mappedTemplateDocument] = await this.clientDataMappingService.mapDocsOrRevisions([doc, templateDocument], user);
    const templateSections = mappedTemplateDocument ? this.clientDataMappingService.createProposedSections(mappedTemplateDocument, doc.roomId) : [];

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.doc, { doc: mappedDocument, templateSections, room: mappedRoom });
  }

  async handlePostDocument(req, res) {
    const { user } = req;
    const data = req.body;

    if (data.roomId) {
      const room = await this.roomService.getRoomById(data.roomId);

      if (!room) {
        throw new BadRequest(`Unknown room id '${data.roomId}'`);
      }

      if (!isRoomOwnerOrCollaborator({ room, userId: user._id })) {
        throw new Forbidden();
      }
    }

    const newDocument = await this.documentService.createDocument({ data, user });
    const mappedNewDocument = await this.clientDataMappingService.mapDocOrRevision(newDocument, user);
    return res.status(201).send(mappedNewDocument);
  }

  async handlePatchDocumentMetadata(req, res) {
    const { user } = req;
    const metadata = req.body;
    const { documentId } = req.params;

    await this._authorizeDocumentWriteAccess(req);

    const updatedDocument = await this.documentService.updateDocumentMetadata({ documentId, metadata, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentSections(req, res) {
    const { user } = req;
    const { sections } = req.body;
    const { documentId } = req.params;

    await this._authorizeDocumentWriteAccess(req);

    const updatedDocument = await this.documentService.updateDocumentSections({ documentId, sections, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentRestoreRevision(req, res) {
    const { user } = req;
    const { revisionId } = req.body;
    const { documentId } = req.params;

    const documentRevisions = await this.documentService.restoreDocumentRevision({ documentId, revisionId, user });
    if (!documentRevisions.length) {
      throw new NotFound();
    }

    const updatedDocument = await this.documentService.getDocumentById(documentId);
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    const mappedDocumentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(documentRevisions, user);

    return res.status(201).send({ document: mappedDocument, documentRevisions: mappedDocumentRevisions });
  }

  async handlePatchDocArchive(req, res) {
    const { documentId } = req.params;

    const updatedDocument = await this.documentService.updateArchivedState({ documentId, user: req.user, archived: true });
    if (!updatedDocument) {
      throw new NotFound();
    }

    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, req.user);
    return res.send({ doc: mappedDocument });
  }

  async handlePatchDocUnarchive(req, res) {
    const { documentId } = req.params;

    const updatedDocument = await this.documentService.updateArchivedState({ documentId, user: req.user, archived: false });
    if (!updatedDocument) {
      throw new NotFound();
    }

    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, req.user);
    return res.send({ doc: mappedDocument });
  }

  async handleGetDocs(req, res) {
    const { user } = req;
    const { documentId } = req.query;

    const revisions = await this.documentService.getAllDocumentRevisionsByDocumentId(documentId);
    if (!revisions.length) {
      throw new NotFound();
    }

    const documentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(revisions, user);
    return res.send({ documentRevisions });
  }

  async handleGetDoc(req, res) {
    const { user } = req;
    const { documentId } = req.params;

    const doc = await this.documentService.getDocumentById(documentId);
    if (!doc) {
      throw new NotFound();
    }

    const mappedDoc = await this.clientDataMappingService.mapDocOrRevision(doc, user);
    return res.send({ doc: mappedDoc });
  }

  async handleGetSearchableDocsTitles(req, res) {
    const { query } = req.query;

    const documentsMetadata = await this.documentService.findDocumentsMetadataInSearchableDocuments({ query });
    const mappedDocumentsTitles = documentsMetadata.map(doc => ({ _id: doc._id, title: doc.title }));

    return res.send({ documents: mappedDocumentsTitles });
  }

  async handleDeleteDocSection(req, res) {
    const { user } = req;
    const { documentId, sectionKey, sectionRevision, reason, deleteAllRevisions } = req.body;
    const document = await this.documentService.hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions, user });
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(document, req.user);
    return res.send({ document: mappedDocument });
  }

  async handleDeleteDoc(req, res) {
    const { user } = req;
    const { documentId } = req.body;

    const document = await this.documentService.getDocumentById(documentId);

    if (!document) {
      throw new NotFound();
    }

    if (document.origin.startsWith(DOCUMENT_ORIGIN.external) && !hasUserPermission(req.user, permissions.MANAGE_IMPORT)) {
      throw new Forbidden('The user does not have permission to delete external documents');
    }

    if (document.origin === DOCUMENT_ORIGIN.internal && !document.roomId) {
      throw new Forbidden('Public documents can not be deleted');
    }

    if (document.origin === DOCUMENT_ORIGIN.internal && document.roomId) {
      const room = await this.roomService.getRoomById(document.roomId);
      if (!isRoomOwnerOrCollaborator({ room, userId: user._id })) {
        throw new Forbidden(NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE);
      }
    }

    await this.documentService.hardDeleteDocument(documentId);

    return res.send({});
  }

  async handleGetDocTags(req, res) {
    const searchString = req.params[0] || '';

    const result = await this.documentService.getDocumentTagsMatchingText(searchString);
    return res.send(result.length ? result[0].uniqueTags : []);
  }

  async _authorizeDocumentWriteAccess(req) {
    const { user } = req;
    const { documentId } = req.params;

    const document = await this.documentService.getDocumentById(documentId);

    if (!document) {
      throw new NotFound();
    }

    if (document.roomId) {
      const room = await this.roomService.getRoomById(document.roomId);

      if (!isRoomOwnerOrCollaborator({ room, userId: user._id })) {
        throw new Forbidden();
      }
    }
  }

  registerPages(router) {
    router.get(
      '/docs',
      needsPermission(permissions.VIEW_DOCS),
      (req, res) => this.handleGetDocsPage(req, res)
    );

    router.get(
      '/docs/:documentId*',
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
      '/api/v1/docs/:documentId/metadata',
      jsonParser,
      needsPermission(permissions.EDIT_DOC),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(documentMetadataBodySchema),
      (req, res) => this.handlePatchDocumentMetadata(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/sections',
      jsonParserLargePayload,
      needsPermission(permissions.EDIT_DOC),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(patchDocSectionsBodySchema),
      (req, res) => this.handlePatchDocumentSections(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/restore',
      jsonParser,
      needsPermission(permissions.EDIT_DOC),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(restoreRevisionBodySchema),
      (req, res) => this.handlePatchDocumentRestoreRevision(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/archive',
      [needsPermission(permissions.MANAGE_ARCHIVED_DOCS), validateParams(documentIdParamsOrQuerySchema)],
      (req, res) => this.handlePatchDocArchive(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/unarchive',
      [needsPermission(permissions.MANAGE_ARCHIVED_DOCS), validateParams(documentIdParamsOrQuerySchema)],
      (req, res) => this.handlePatchDocUnarchive(req, res)
    );

    router.get(
      '/api/v1/docs',
      [needsPermission(permissions.VIEW_DOCS), validateQuery(documentIdParamsOrQuerySchema)],
      (req, res) => this.handleGetDocs(req, res)
    );

    router.get(
      '/api/v1/docs/titles',
      [needsPermission(permissions.VIEW_DOCS), validateQuery(getSearchableDocumentsTitlesQuerySchema)],
      (req, res) => this.handleGetSearchableDocsTitles(req, res)
    );

    router.get(
      '/api/v1/docs/:documentId',
      [needsPermission(permissions.VIEW_DOCS), validateParams(documentIdParamsOrQuerySchema)],
      (req, res) => this.handleGetDoc(req, res)
    );

    router.delete(
      '/api/v1/docs/sections',
      [needsPermission(permissions.HARD_DELETE_SECTION), jsonParser, validateBody(hardDeleteSectionBodySchema)],
      (req, res) => this.handleDeleteDocSection(req, res)
    );

    router.delete(
      '/api/v1/docs',
      [needsPermission(permissions.VIEW_DOCS), jsonParser, validateBody(hardDeleteDocumentBodySchema)],
      (req, res) => this.handleDeleteDoc(req, res)
    );

    router.get(
      '/api/v1/docs/tags/*',
      (req, res) => this.handleGetDocTags(req, res)
    );
  }
}

export default DocumentController;
