import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { canEditDoc } from '../utils/doc-utils.js';
import RoomService from '../services/room-service.js';
import { shuffleItems } from '../utils/array-utils.js';
import SettingService from '../services/setting-service.js';
import { DOC_VIEW_QUERY_PARAM } from '../domain/constants.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { isRoomOwner, isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  documentIdParamsOrQuerySchema,
  updateDocumentMetadataBodySchema,
  hardDeleteSectionBodySchema,
  hardDeleteDocumentBodySchema,
  restoreRevisionBodySchema,
  getDocumentParamsSchema,
  getDocumentQuerySchema,
  patchDocSectionsBodySchema,
  createDocumentDataBodySchema,
  getPublicNonArchivedDocumentsByContributingUserParams,
  getSearchableDocumentsTitlesQuerySchema
} from '../domain/schemas/document-schemas.js';

const { NotFound, Forbidden, Unauthorized } = httpErrors;

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });

class DocumentController {
  static dependencies = [DocumentService, RoomService, ClientDataMappingService, SettingService, PageRenderer];

  constructor(documentService, roomService, clientDataMappingService, settingService, pageRenderer) {
    this.settingService = settingService;
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
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

        if (!isRoomOwnerOrInvitedMember({ room: templateDocumentRoom, userId: user._id })) {
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

      if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
        throw new Forbidden();
      }

      if (doc.roomContext.draft && !isRoomOwner({ room, userId: user._id })) {
        throw new Forbidden();
      }
    } else {
      room = null;
    }

    if (view === DOC_VIEW_QUERY_PARAM.edit && !canEditDoc({ user, doc, room })) {
      return res.redirect(routes.getDocUrl({ id: doc._id, slug: doc.slug }));
    }

    const mappedRoom = room ? await this.clientDataMappingService.mapRoom({ room, viewingUser: user }) : null;
    const [mappedDocument, mappedTemplateDocument] = await this.clientDataMappingService.mapDocsOrRevisions([doc, templateDocument], user);
    const templateSections = mappedTemplateDocument ? this.clientDataMappingService.createProposedSections(mappedTemplateDocument, doc.roomId) : [];

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.doc, { doc: mappedDocument, templateSections, room: mappedRoom });
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

  async handleGetDocsForHomepage(req, res) {
    const settings = await this.settingService.getAllSettings();

    const shuffledDocumentIds = shuffleItems(settings.homepageDocuments || []);
    const idsOfDocumentsToShow = shuffledDocumentIds.slice(0, 3);
    let mappedDocuments = [];

    if (idsOfDocumentsToShow.length) {
      const documents = await this.documentService.getDocumentsExtendedMetadataByIds(idsOfDocumentsToShow);
      mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(documents);
    }

    return res.send({ documents: mappedDocuments });
  }

  async handleGetDocumentsByContributingUser(req, res) {
    const { userId } = req.params;

    const contributedDocuments = await this.documentService.getPublicNonArchivedDocumentsByContributingUser(userId);
    const mappedContributedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(contributedDocuments);

    return res.send({ documents: mappedContributedDocuments });
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
    const { documentId } = req.params;

    const updatedDocument = await this.documentService.updateDocumentMetadata({ documentId, metadata, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentSections(req, res) {
    const { user } = req;
    const { sections } = req.body;
    const { documentId } = req.params;

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

  async handleGetDocs(req, res) {
    const { user } = req;
    const { documentId } = req.query;

    const document = await this.documentService.getDocumentById(documentId);
    const revisions = await this.documentService.getAllDocumentRevisionsByDocumentId(documentId);
    if (!document || !revisions.length) {
      throw new NotFound();
    }

    if (document.roomId && !user) {
      throw new Forbidden();
    }

    const documentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(revisions, user);
    return res.send({ documentRevisions });
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
    await this.documentService.hardDeleteDocument({ documentId, user });
    return res.send({});
  }

  async handleGetDocTags(req, res) {
    const searchString = req.params[0] || '';

    const result = await this.documentService.getDocumentTagsMatchingText(searchString);
    return res.send(result.length ? result[0].uniqueTags : []);
  }

  registerPages(router) {
    router.get(
      '/docs/:documentId*',
      validateParams(getDocumentParamsSchema),
      validateQuery(getDocumentQuerySchema),
      needsPermission({
        value: permissions.CREATE_CONTENT,
        condition: req => Object.values(DOC_VIEW_QUERY_PARAM).includes(req.query.view)
      }),
      (req, res) => this.handleGetDocPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/docs',
      [validateQuery(documentIdParamsOrQuerySchema)],
      (req, res) => this.handleGetDocs(req, res)
    );

    router.get(
      '/api/v1/docs/titles',
      [needsPermission(permissions.VIEW_CONTENT), validateQuery(getSearchableDocumentsTitlesQuerySchema)],
      (req, res) => this.handleGetSearchableDocsTitles(req, res)
    );

    router.get(
      '/api/v1/docs/homepage',
      (req, res) => this.handleGetDocsForHomepage(req, res)
    );

    router.get(
      '/api/v1/docs/:documentId',
      [needsPermission(permissions.VIEW_CONTENT), validateParams(documentIdParamsOrQuerySchema)],
      (req, res) => this.handleGetDoc(req, res)
    );

    router.get(
      '/api/v1/docs/users/:userId',
      [validateParams(getPublicNonArchivedDocumentsByContributingUserParams)],
      (req, res) => this.handleGetDocumentsByContributingUser(req, res)
    );

    router.get(
      '/api/v1/docs/tags/*',
      (req, res) => this.handleGetDocTags(req, res)
    );

    router.post(
      '/api/v1/docs',
      jsonParserLargePayload,
      needsPermission(permissions.CREATE_CONTENT),
      validateBody(createDocumentDataBodySchema),
      (req, res) => this.handlePostDocument(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/metadata',
      jsonParser,
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(updateDocumentMetadataBodySchema),
      (req, res) => this.handlePatchDocumentMetadata(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/sections',
      jsonParserLargePayload,
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(patchDocSectionsBodySchema),
      (req, res) => this.handlePatchDocumentSections(req, res)
    );

    router.patch(
      '/api/v1/docs/:documentId/restore',
      jsonParser,
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(restoreRevisionBodySchema),
      (req, res) => this.handlePatchDocumentRestoreRevision(req, res)
    );

    router.delete(
      '/api/v1/docs/sections',
      [needsPermission(permissions.MANAGE_PUBLIC_CONTENT), jsonParser, validateBody(hardDeleteSectionBodySchema)],
      (req, res) => this.handleDeleteDocSection(req, res)
    );

    router.delete(
      '/api/v1/docs',
      [needsPermission(permissions.VIEW_CONTENT), jsonParser, validateBody(hardDeleteDocumentBodySchema)],
      (req, res) => this.handleDeleteDoc(req, res)
    );
  }
}

export default DocumentController;
