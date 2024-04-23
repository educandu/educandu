import express from 'express';
import httpErrors from 'http-errors';
import permissions from '../domain/permissions.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentCategoryService from '../services/document-category-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import {
  documentCategoryIdParamsSchema,
  patchDocumentCategoryDocumentsBodySchema,
  postDocumentCategoryBodySchema
} from '../domain/schemas/document-category-schemas.js';

const { NotFound } = httpErrors;
const jsonParser = express.json();

class DocumentCategoryController {
  static dependencies = [DocumentCategoryService, ClientDataMappingService];

  constructor(documentCategoryService, clientDataMappingService) {
    this.documentCategoryService = documentCategoryService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handlePostDocumentCategoryCreationRequest(req, res) {
    const { user } = req;
    const { name, iconUrl, description } = req.body;

    const { result, documentCategory } = await this.documentCategoryService.createDocumentCategory({ name, iconUrl, description, user });
    const mappedDocumentCategory = await this.clientDataMappingService.mapDocumentCategory(documentCategory);

    res.status(201).send({ result, documentCategory: mappedDocumentCategory });
  }

  async handlePatchDocumentCategory(req, res) {
    const { user } = req;
    const { documentCategoryId } = req.params;
    const { name, iconUrl, description } = req.body;

    const documentCategory = await this.documentCategoryService.getDocumentCategoryById(documentCategoryId);

    if (!documentCategory) {
      throw new NotFound();
    }

    const serviceResponse = await this.documentCategoryService.updateDocumentCategory({ documentCategoryId, name, iconUrl, description, user });
    const mappedDocumentCategory = await this.clientDataMappingService.mapDocumentCategory(serviceResponse.documentCategory);

    return res.status(201).send({ result: serviceResponse.result, documentCategory: mappedDocumentCategory });
  }

  async handlePatchDocumentCategoryDocuments(req, res) {
    const { user } = req;
    const { documentCategoryId } = req.params;
    const { documentIds } = req.body;

    const documentCategory = await this.documentCategoryService.getDocumentCategoryById(documentCategoryId);

    if (!documentCategory) {
      throw new NotFound();
    }

    const updatedDocumentCategory = await this.documentCategoryService.updateDocumentCategoryDocuments({ documentCategoryId, documentIds, user });
    const mappedDocumentCategory = await this.clientDataMappingService.mapDocumentCategory(updatedDocumentCategory);

    return res.status(201).send({ documentCategory: mappedDocumentCategory });
  }

  async handleDeleteDocumentCategory(req, res) {
    const { documentCategoryId } = req.params;

    const documentCategory = await this.documentCategoryService.getDocumentCategoryById(documentCategoryId);

    if (!documentCategory) {
      throw new NotFound();
    }

    await this.documentCategoryService.deleteDocumentCategory(documentCategoryId);

    return res.send({});
  }

  registerApi(router) {
    router.post(
      '/api/v1/document-categories/request-creation',
      jsonParser,
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateBody(postDocumentCategoryBodySchema),
      (req, res) => this.handlePostDocumentCategoryCreationRequest(req, res)
    );

    router.patch(
      '/api/v1/document-categories/:documentCategoryId',
      jsonParser,
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateParams(documentCategoryIdParamsSchema),
      validateBody(postDocumentCategoryBodySchema),
      (req, res) => this.handlePatchDocumentCategory(req, res)
    );

    router.patch(
      '/api/v1/document-categories/:documentCategoryId/documents',
      jsonParser,
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateParams(documentCategoryIdParamsSchema),
      validateBody(patchDocumentCategoryDocumentsBodySchema),
      (req, res) => this.handlePatchDocumentCategoryDocuments(req, res)
    );

    router.delete(
      '/api/v1/document-categories/:documentCategoryId',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateParams(documentCategoryIdParamsSchema),
      (req, res) => this.handleDeleteDocumentCategory(req, res)
    );
  }
}

export default DocumentCategoryController;
