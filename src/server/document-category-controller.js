import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import slugify from '@sindresorhus/slugify';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentCategoryService from '../services/document-category-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import {
  documentCategoryIdParamsSchema,
  getDocumentCategoryPageParamsSchema,
  patchDocumentCategoryDocumentsBodySchema,
  postDocumentCategoryBodySchema
} from '../domain/schemas/document-category-schemas.js';

const { NotFound } = httpErrors;
const jsonParser = express.json();

class DocumentCategoryController {
  static dependencies = [DocumentCategoryService, ClientDataMappingService, PageRenderer];

  constructor(documentCategoryService, clientDataMappingService, pageRenderer) {
    this.documentCategoryService = documentCategoryService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetDocumentCategoryPage(req, res) {
    // const { user } = req;
    const { documentCategoryId } = req.params;
    const routeWildcardValue = urlUtils.removeLeadingSlashes(req.params[0]);

    const documentCategory = await this.documentCategoryService.getDocumentCategoryById(documentCategoryId);
    if (!documentCategory) {
      throw new NotFound();
    }

    const canonicalSlug = slugify(documentCategory.name);

    if (routeWildcardValue !== canonicalSlug) {
      return res.redirect(301, routes.getDocumentCategoryUrl({ id: documentCategoryId, slug: canonicalSlug }));
    }

    const mappedDocumentCategory = await this.clientDataMappingService.mapDocumentCategory(documentCategory);

    const initialState = { documentCategory: mappedDocumentCategory };
    const pageName = PAGE_NAME.documentCategory;

    return this.pageRenderer.sendPage(req, res, pageName, initialState);
  }

  async handleGetDocumentCategories(req, res) {
    const documentCategories = await this.documentCategoryService.getAllDocumentCategories();
    const mappedDocumentCategories = await this.clientDataMappingService.mapDocumentCategories(documentCategories);

    res.status(200).send({ documentCategories: mappedDocumentCategories });
  }

  async handlePostDocumentCategory(req, res) {
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

  registerPages(router) {
    router.get(
      '/document-categories/:documentCategoryId*',
      validateParams(getDocumentCategoryPageParamsSchema),
      (req, res) => this.handleGetDocumentCategoryPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/document-categories',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetDocumentCategories(req, res)
    );

    router.post(
      '/api/v1/document-categories',
      jsonParser,
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      validateBody(postDocumentCategoryBodySchema),
      (req, res) => this.handlePostDocumentCategory(req, res)
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
