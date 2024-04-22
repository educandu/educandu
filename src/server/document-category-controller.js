import express from 'express';
import { validateBody } from '../domain/validation-middleware.js';
import DocumentCategoryService from '../services/document-category-service.js';
import { postCategoryCreationRequestBodySchema } from '../domain/schemas/document-category-schemas.js';

const jsonParser = express.json();

class DocumentCategoryController {
  static dependencies = [DocumentCategoryService];

  constructor(documentCategoryService) {
    this.documentCategoryService = documentCategoryService;
  }

  async handlePostCategoryCreationRequest(req, res) {
    const { user } = req;
    const { name, iconUrl, description } = req.body;

    const { result, documentCategory } = await this.documentCategoryService.createDocumentCategory({ name, iconUrl, description, user });

    res.status(201).send({ result, documentCategory });
  }

  registerApi(router) {
    router.post(
      '/api/v1/document-categories/request-creation',
      jsonParser,
      validateBody(postCategoryCreationRequestBodySchema),
      (req, res) => this.handlePostCategoryCreationRequest(req, res)
    );
  }
}

export default DocumentCategoryController;
