import express from 'express';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentInputService from '../services/document-input-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import {
  documentInputIdParamsOrQuerySchema,
  getDocumentInputsCreatedByUserParams,
  createDocumentInputDataBodySchema,
  hardDeleteDocumentInputBodySchema
} from '../domain/schemas/document-input-schemas.js';

const jsonParser = express.json();
const jsonParserLargePayload = express.json({ limit: '2MB' });

class DocumentInputController {
  static dependencies = [DocumentInputService, RoomService, ClientDataMappingService];

  constructor(documentInputService, roomService, clientDataMappingService) {
    this.roomService = roomService;
    this.documentInputService = documentInputService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetDocumentInput(req, res) {
    const { user } = req;
    const { documentInputId } = req.params;

    const documentInput = await this.documentInputService.getDocumentInputById({ documentInputId, user });
    const mappedDocumentInput = await this.clientDataMappingService.mapDocumentInput(documentInput);

    return res.send({ documentInput: mappedDocumentInput });
  }

  async handleGetDocumentInputsCreatedByUser(req, res) {
    const { userId } = req.params;

    const createdDocumentInputs = await this.documentInputService.handleGetDocumentInputsCreatedByUser(userId);
    const mappedCreatedDocumentInputs = await this.clientDataMappingService.mapDocumentInputs(createdDocumentInputs);

    return res.send({ documentInputs: mappedCreatedDocumentInputs });
  }

  async handlePostDocumentInput(req, res) {
    const { user } = req;
    const { documentId, documentRevisionId, sections } = req.body;

    const newDocumentInput = await this.documentInputService.createDocumentInput({ documentId, documentRevisionId, sections, user });
    const mappedNewDocumentInput = await this.clientDataMappingService.mapDocumentInput(newDocumentInput);
    return res.status(201).send(mappedNewDocumentInput);
  }

  async handleHardDeleteDocumentInput(req, res) {
    const { user } = req;
    const { documentInputId } = req.body;
    await this.documentInputService.hardDeleteDocumentInput({ documentInputId, user });
    return res.send({});
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
