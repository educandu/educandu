import express from 'express';
import permissions from '../domain/permissions.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentCategoryService from '../services/document-category-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { documentCategoryIdParamsOrQuerySchema, postDocumentCategoryRequestBodySchema } from '../domain/schemas/document-category-schemas.js';

const jsonParser = express.json();

class DocumentCategoryController {
  static dependencies = [DocumentCategoryService];

  constructor(documentCategoryService) {
    this.documentCategoryService = documentCategoryService;
  }

  async handlePostDocumentCategoryCreationRequest(req, res) {
    const { user } = req;
    const { name, iconUrl, description } = req.body;

    const { result, documentCategory } = await this.documentCategoryService.createDocumentCategory({ name, iconUrl, description, user });

    res.status(201).send({ result, documentCategory });
  }

  async handlePatchDocumentCategory(req, res) {
    const { user } = req;
    const { documentCategoryId } = req.params;
    const { name, iconUrl, description } = req.body;

    const { result, documentCategory } = await this.documentCategoryService.updateDocumentCategory({ documentCategoryId, name, iconUrl, description, user });

    return res.status(201).send({ result, documentCategory });
  }

  registerApi(router) {
    router.post(
      '/api/v1/document-categories/request-creation',
      jsonParser,
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateBody(postDocumentCategoryRequestBodySchema),
      (req, res) => this.handlePostDocumentCategoryCreationRequest(req, res)
    );

    router.patch(
      '/api/v1/document-categories/:documentCategoryId',
      jsonParser,
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateParams(documentCategoryIdParamsOrQuerySchema),
      validateBody(postDocumentCategoryRequestBodySchema),
      (req, res) => this.handlePatchDocumentCategory(req, res)
    );
  }
}

export default DocumentCategoryController;
