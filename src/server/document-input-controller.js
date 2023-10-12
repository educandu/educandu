import express from 'express';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentInputService from '../services/document-input-service.js';
import { isRoomOwnerOrInvitedCollaborator } from '../utils/room-utils.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import {
  documentInputIdParamsOrQuerySchema,
  getDocumentInputsCreatedByUserParams,
  createDocumentInputDataBodySchema,
  hardDeleteDocumentInputBodySchema,
  getDocumentInputsByDocumentIdParams
} from '../domain/schemas/document-input-schemas.js';

const { Forbidden, NotFound } = httpErrors;

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });

class DocumentInputController {
  static dependencies = [DocumentInputService, DocumentService, RoomService, ClientDataMappingService, PageRenderer];

  constructor(documentInputService, documentService, roomService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.documentService = documentService;
    this.documentInputService = documentInputService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetDocumentInputPage(req, res) {
    const { user } = req;
    const { documentInputId } = req.params;

    const documentInput = await this.documentInputService.getDocumentInputById({ documentInputId, user });

    if (!documentInput) {
      throw new NotFound();
    }

    const documentRevision = await this.documentService.getDocumentRevisionById(documentInput.documentRevisionId);
    if (!documentRevision) {
      throw new NotFound(`Document revision '${documentInput.documentRevisionId}' not found.`);
    }

    const room = await this.roomService.getRoomById(documentRevision.roomId);
    if (documentInput.createdBy !== user._id && !isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to view document input '${documentInputId}'`);
    }

    const mappedDocumentRevision = await this.clientDataMappingService.mapDocOrRevision(documentRevision, user);
    const mappedDocumentInput = await this.clientDataMappingService.mapDocumentInput(documentInput);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.documentInput, {
      documentInput: mappedDocumentInput,
      documentRevision: mappedDocumentRevision
    });
  }

  async handleGetDocumentInput(req, res) {
    const { user } = req;
    const { documentInputId } = req.params;

    const documentInput = await this.documentInputService.getDocumentInputById({ documentInputId, user });
    const document = await this.documentService.getDocumentById(documentInput.documentId);
    const mappedDocumentInput = await this.clientDataMappingService.mapDocumentInput({ documentInput, document });

    return res.send({ documentInput: mappedDocumentInput });
  }

  async handleGetDocumentInputsCreatedByUser(req, res) {
    const { userId } = req.params;

    const documentInputs = await this.documentInputService.getDocumentInputsCreatedByUser(userId);
    const documentIds = documentInputs.map(input => input.documentId);
    const documents = await this.documentService.getDocumentsMetadataByIds(documentIds);

    const mappedDocumentInputs = await this.clientDataMappingService.mapDocumentInputs({ documentInputs, documents });

    return res.send({ documentInputs: mappedDocumentInputs });
  }

  async handleGetDocumentInputsByDocumentId(req, res) {
    const { documentId } = req.params;

    const documentInputs = await this.documentInputService.getDocumentInputsByDocumentId(documentId);
    const documentIds = documentInputs.map(input => input.documentId);
    const documents = await this.documentService.getDocumentsMetadataByIds(documentIds);

    const mappeddocumentInputs = await this.clientDataMappingService.mapDocumentInputs({ documentInputs, documents });

    return res.send({ documentInputs: mappeddocumentInputs });
  }

  async handlePostDocumentInput(req, res) {
    const { user } = req;
    const { documentId, documentRevisionId, sections } = req.body;

    const documentInput = await this.documentInputService.createDocumentInput({ documentId, documentRevisionId, sections, user });
    const document = await this.documentService.getDocumentById(documentInput.documentId);

    const mappedNewDocumentInput = await this.clientDataMappingService.mapDocumentInput({ documentInput, document });

    return res.status(201).send(mappedNewDocumentInput);
  }

  async handleHardDeleteDocumentInput(req, res) {
    const { user } = req;
    const { documentInputId } = req.body;
    await this.documentInputService.hardDeleteDocumentInput({ documentInputId, user });
    return res.send({});
  }

  registerPages(router) {
    router.get(
      '/doc-inputs/:documentInputId',
      (req, res) => this.handleGetDocumentInputPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/doc-inputs/:documentInputId',
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(documentInputIdParamsOrQuerySchema),
      (req, res) => this.handleGetDocumentInput(req, res)
    );

    router.get(
      '/api/v1/doc-inputs/users/:userId',
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(getDocumentInputsCreatedByUserParams),
      (req, res) => this.handleGetDocumentInputsCreatedByUser(req, res)
    );

    router.get(
      '/api/v1/doc-inputs/documents/:documentId',
      needsPermission(permissions.CREATE_CONTENT),
      validateParams(getDocumentInputsByDocumentIdParams),
      (req, res) => this.handleGetDocumentInputsByDocumentId(req, res)
    );

    router.post(
      '/api/v1/doc-inputs',
      jsonParserLargePayload,
      needsPermission(permissions.CREATE_CONTENT),
      validateBody(createDocumentInputDataBodySchema),
      (req, res) => this.handlePostDocumentInput(req, res)
    );

    router.delete(
      '/api/v1/doc-inputs',
      jsonParser,
      needsPermission(permissions.DELETE_OWN_PRIVATE_CONTENT),
      validateBody(hardDeleteDocumentInputBodySchema),
      (req, res) => this.handleHardDeleteDocumentInput(req, res)
    );
  }
}

export default DocumentInputController;
