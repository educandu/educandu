import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { isRoomOwner } from '../utils/room-utils.js';
import RoomService from '../services/room-service.js';
import { shuffleItems } from '../utils/array-utils.js';
import ServerConfig from '../bootstrap/server-config.js';
import SettingService from '../services/setting-service.js';
import DocumentService from '../services/document-service.js';
import { DOC_VIEW_QUERY_PARAM } from '../domain/constants.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import DocumentRatingService from '../services/document-rating-service.js';
import DocumentRequestService from '../services/document-request-service.js';
import { canEditDocument, canViewDocument } from '../utils/document-utils.js';
import DocumentCategoryService from '../services/document-category-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  documentIdParamsOrQuerySchema,
  updateDocumentMetadataBodySchema,
  hardDeleteSectionBodySchema,
  hardDeletePrivateDocumentBodySchema,
  restoreRevisionBodySchema,
  getDocumentParamsSchema,
  getDocumentQuerySchema,
  patchDocSectionsBodySchema,
  createDocumentDataBodySchema,
  getPublicNonArchivedDocumentsByContributingUserParams,
  getPublicNonArchivedDocumentsByContributingUserQuery,
  getSearchableDocumentsTitlesQuerySchema,
  publishDocumentBodySchema
} from '../domain/schemas/document-schemas.js';

const { NotFound, Forbidden, Unauthorized } = httpErrors;

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });

class DocumentController {
  static dependencies = [
    DocumentService,
    RoomService,
    DocumentRatingService,
    DocumentRequestService,
    DocumentCategoryService,
    ClientDataMappingService,
    SettingService,
    PageRenderer,
    ServerConfig
  ];

  constructor(
    documentService,
    roomService,
    documentRatingService,
    documentRequestService,
    documentCategoryService,
    clientDataMappingService,
    settingService,
    pageRenderer,
    serverConfig
  ) {
    this.documentService = documentService;
    this.roomService = roomService;
    this.documentRatingService = documentRatingService;
    this.documentRequestService = documentRequestService;
    this.documentCategoryService = documentCategoryService;
    this.clientDataMappingService = clientDataMappingService;
    this.settingService = settingService;
    this.pageRenderer = pageRenderer;
    this.serverConfig = serverConfig;
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

    if (doc.publicContext?.archived && !hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)) {
      if (doc.publicContext.archiveRedirectionDocumentId) {
        return res.redirect(302, routes.getDocUrl({ id: doc.publicContext.archiveRedirectionDocumentId }));
      }
      throw new NotFound();
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

        if (!canViewDocument({ doc: templateDocument, room: templateDocumentRoom, user })) {
          throw new Forbidden();
        }
      }
    } else {
      templateDocument = null;
    }

    let room;
    let roomMediaContext;
    if (doc.roomId) {
      if (!user) {
        throw new Unauthorized();
      }

      room = await this.roomService.getRoomById(doc.roomId);

      if (!canViewDocument({ doc, room, user })) {
        throw new Forbidden();
      }

      const singleRoomMediaOverview = await this.roomService.getSingleRoomMediaOverview({ user, roomId: room._id });
      const mappedSingleRoomMediaOverview = await this.clientDataMappingService.mapSingleRoomMediaOverview(singleRoomMediaOverview, user);

      roomMediaContext = singleRoomMediaOverview.storagePlan || singleRoomMediaOverview.usedBytes
        ? {
          singleRoomMediaOverview: mappedSingleRoomMediaOverview,
          isDeletionEnabled: isRoomOwner({ room: room || null, userId: user._id })
        }
        : null;
    } else {
      room = null;
      roomMediaContext = null;
    }

    if (view === DOC_VIEW_QUERY_PARAM.edit && !canEditDocument({ user, doc, room })) {
      return res.redirect(routes.getDocUrl({ id: doc._id, slug: doc.slug }));
    }

    let documentRating;
    let documentCategories;
    let mappedDocumentCategories;
    if (!room) {
      documentRating = await this.documentRatingService.getDocumentRatingByDocumentId(doc._id);
      documentCategories = await this.documentCategoryService.getDocumentCategoriesByDocumentId(doc._id);
      mappedDocumentCategories = await this.clientDataMappingService.mapDocumentCategories(documentCategories);
    } else {
      documentRating = null;
      documentCategories = [];
      mappedDocumentCategories = [];
    }

    const mappedRoom = room ? await this.clientDataMappingService.mapRoom({ room, viewingUser: user }) : null;
    const [mappedDocument, mappedTemplateDocument] = await this.clientDataMappingService.mapDocsOrRevisions([doc, templateDocument], user);
    const templateSections = mappedTemplateDocument ? this.clientDataMappingService.createProposedSections(mappedTemplateDocument, doc.roomId) : [];

    const initialState = {
      doc: mappedDocument,
      documentCategories: mappedDocumentCategories,
      documentRating,
      templateSections,
      room: mappedRoom,
      roomMediaContext
    };

    const pageName = PAGE_NAME.document;

    await this.documentRequestService.tryRegisterDocumentReadRequest({ document: doc, user });

    return this.pageRenderer.sendPage(req, res, pageName, initialState);
  }

  async handleGetDoc(req, res) {
    const { user } = req;
    const { documentId } = req.params;

    const doc = await this.documentService.getDocumentById(documentId);
    if (!doc) {
      throw new NotFound();
    }

    const room = doc.roomId ? await this.roomService.getRoomById(doc.roomId) : null;

    if (!canViewDocument({ doc, room, user })) {
      throw new Forbidden();
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
    const { user } = req;

    const settings = await this.settingService.getAllSettings();

    const shuffledDocumentIds = shuffleItems(settings.homepageDocuments || []);
    const idsOfDocumentsToShow = shuffledDocumentIds.slice(0, 3);
    let mappedDocuments = [];

    if (idsOfDocumentsToShow.length) {
      const documents = await this.documentService.getDocumentsExtendedMetadataByIds(idsOfDocumentsToShow);
      const allowedDocuments = documents.filter(doc => !doc.roomId && canViewDocument({ doc, room: null, user }));
      mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(allowedDocuments);
    }

    return res.send({ documents: mappedDocuments });
  }

  async handleGetDocsForContentManagementOrStatistics(req, res) {
    const { user } = req;

    const documents = await this.documentService.getAllPublicDocumentsExtendedMetadata({ includeArchived: true });
    const mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(documents, user);

    return res.send({ documents: mappedDocuments });
  }

  async handleGetDocumentsByContributingUser(req, res) {
    const { userId } = req.params;
    const createdOnly = req.query.createdOnly === true.toString();

    const contributedDocuments = createdOnly
      ? await this.documentService.getPublicNonArchivedDocumentsByCreatingUser(userId)
      : await this.documentService.getPublicNonArchivedDocumentsByContributingUser(userId);

    const mappedContributedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(contributedDocuments);

    return res.send({ documents: mappedContributedDocuments });
  }

  async handlePostDocument(req, res) {
    const { user } = req;
    const data = req.body;

    const newDocument = await this.documentService.createDocument({ data, user });
    const mappedNewDocument = await this.clientDataMappingService.mapDocOrRevision(newDocument, user);

    await this.documentRequestService.tryRegisterDocumentWriteRequest({ document: newDocument, user });

    return res.status(201).send(mappedNewDocument);
  }

  async handlePatchDocumentMetadata(req, res) {
    const { user } = req;
    const { documentId } = req.params;
    const { metadata, revisionCreatedBecause } = req.body;

    const updatedDocument = await this.documentService.updateDocumentMetadata({ documentId, metadata, revisionCreatedBecause, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);

    await this.documentRequestService.tryRegisterDocumentWriteRequest({ document: updatedDocument, user });

    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentSections(req, res) {
    const { user } = req;
    const { documentId } = req.params;
    const { sections, revisionCreatedBecause } = req.body;

    const updatedDocument = await this.documentService.updateDocumentSections({ documentId, sections, revisionCreatedBecause, user });
    const mappedUpdatedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);

    await this.documentRequestService.tryRegisterDocumentWriteRequest({ document: updatedDocument, user });

    return res.status(201).send(mappedUpdatedDocument);
  }

  async handlePatchDocumentRestoreRevision(req, res) {
    const { user } = req;
    const { documentId } = req.params;
    const { revisionId, revisionRestoredBecause } = req.body;

    const documentRevisions = await this.documentService.restoreDocumentRevision({ documentId, revisionId, revisionRestoredBecause, user });
    if (!documentRevisions.length) {
      throw new NotFound();
    }

    const updatedDocument = await this.documentService.getDocumentById(documentId);
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(updatedDocument, user);
    const mappedDocumentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(documentRevisions, user);

    return res.status(201).send({ document: mappedDocument, documentRevisions: mappedDocumentRevisions });
  }

  async handlePatchDocumentPublish(req, res) {
    const { user } = req;
    const { metadata } = req.body;
    const { documentId } = req.params;

    const publishedDocument = await this.documentService.publishDocument({ documentId, metadata, user });
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(publishedDocument, user);

    return res.status(201).send(mappedDocument);
  }

  async handleGetDocumentRevisions(req, res) {
    const { user } = req;
    const { documentId } = req.params;

    const document = await this.documentService.getDocumentById(documentId);
    const revisions = await this.documentService.getAllDocumentRevisionsByDocumentId(documentId);
    if (!document || !revisions.length) {
      throw new NotFound();
    }

    if (document.roomId) {
      const room = await this.roomService.getRoomById(document.roomId);
      if (!canViewDocument({ doc: document, room, user })) {
        throw new Forbidden();
      }
    }

    const documentRevisions = await this.clientDataMappingService.mapDocsOrRevisions(revisions, user);
    return res.send({ documentRevisions });
  }

  async handleDeleteDocSection(req, res) {
    const { user } = req;
    const { documentId, sectionKey, sectionRevision, reason, deleteAllRevisions } = req.body;
    const document = await this.documentService.hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions, user });
    const mappedDocument = await this.clientDataMappingService.mapDocOrRevision(document, req.user);

    await this.documentRequestService.tryRegisterDocumentWriteRequest({ document, user });

    return res.send({ document: mappedDocument });
  }

  async handleDeletePrivateDoc(req, res) {
    const { user } = req;
    const { documentId } = req.body;
    await this.documentService.hardDeletePrivateDocument({ documentId, user });
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
        condition: req => req.query.view === DOC_VIEW_QUERY_PARAM.edit
      }),
      (req, res) => this.handleGetDocPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/docs/titles',
      validateQuery(getSearchableDocumentsTitlesQuerySchema),
      (req, res) => this.handleGetSearchableDocsTitles(req, res)
    );

    router.get(
      '/api/v1/docs/homepage',
      (req, res) => this.handleGetDocsForHomepage(req, res)
    );

    router.get(
      '/api/v1/docs/content-management',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetDocsForContentManagementOrStatistics(req, res)
    );

    router.get(
      '/api/v1/docs/statistics',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetDocsForContentManagementOrStatistics(req, res)
    );

    router.get(
      '/api/v1/docs/users/:userId',
      validateQuery(getPublicNonArchivedDocumentsByContributingUserQuery),
      validateParams(getPublicNonArchivedDocumentsByContributingUserParams),
      (req, res) => this.handleGetDocumentsByContributingUser(req, res)
    );

    router.get(
      '/api/v1/docs/tags/*',
      (req, res) => this.handleGetDocTags(req, res)
    );

    router.get(
      '/api/v1/docs/:documentId/revisions',
      validateParams(documentIdParamsOrQuerySchema),
      (req, res) => this.handleGetDocumentRevisions(req, res)
    );

    router.get(
      '/api/v1/docs/:documentId',
      validateParams(documentIdParamsOrQuerySchema),
      (req, res) => this.handleGetDoc(req, res)
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

    router.patch(
      '/api/v1/docs/:documentId/publish',
      jsonParser,
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(documentIdParamsOrQuerySchema),
      validateBody(publishDocumentBodySchema),
      (req, res) => this.handlePatchDocumentPublish(req, res)
    );

    router.delete(
      '/api/v1/docs/sections',
      jsonParser,
      needsPermission(permissions.DELETE_PUBLIC_CONTENT),
      validateBody(hardDeleteSectionBodySchema),
      (req, res) => this.handleDeleteDocSection(req, res)
    );

    router.delete(
      '/api/v1/docs',
      jsonParser,
      needsPermission(permissions.DELETE_OWN_PRIVATE_CONTENT),
      validateBody(hardDeletePrivateDocumentBodySchema),
      (req, res) => this.handleDeletePrivateDoc(req, res)
    );
  }
}

export default DocumentController;
