import express from 'express';
import httpErrors from 'http-errors';
import permissions from '../domain/permissions.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentCommentService from '../services/document-comment-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { documentIdParamsOrQuerySchema } from '../domain/schemas/document-schemas.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { documentCommentIdParamsOrQuerySchema, postDocumentCommentsTopicBodySchema, putDocumentCommentBodySchema } from '../domain/schemas/document-comment-schemas.js';

const jsonParser = express.json();
const { BadRequest, NotFound } = httpErrors;

class DocumentCommentController {
  static dependencies = [DocumentCommentService, DocumentService, ClientDataMappingService];

  constructor(documentCommentService, documentService, clientDataMappingService) {
    this.documentCommentService = documentCommentService;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetDocumentComments(req, res) {
    const { documentId } = req.query;

    const documentComments = await this.documentCommentService.getAllDocumentComments(documentId);
    const mappedDocumentComments = await this.clientDataMappingService.mapDocumentComments(documentComments);

    return res.send({ documentComments: mappedDocumentComments });
  }

  async handlePutDocumentComment(req, res) {
    const { user } = req;
    const data = req.body;

    const document = await this.documentService.getDocumentById(data.documentId);

    if (!document) {
      throw new BadRequest(`Unknown document ID '${data.documentId}'`);
    }

    const documentComment = await this.documentCommentService.createDocumentComment({ data, user });
    const mappedDocumentComment = await this.clientDataMappingService.mapDocumentComment(documentComment);
    return res.status(201).send(mappedDocumentComment);
  }

  async handlePostDocumentCommentsTopic(req, res) {
    const { documentId, oldTopic, newTopic } = req.body;

    await this.documentCommentService.updateDocumentCommentsTopic({ documentId, oldTopic, newTopic });
    return res.status(201).send();
  }

  async handleDeleteDocumentComment(req, res) {
    const { user } = req;
    const { documentCommentId } = req.params;

    const documentComment = await this.documentCommentService.getDocumentCommentById(documentCommentId);

    if (!documentComment || documentComment.deletedOn) {
      throw new NotFound();
    }

    await this.documentCommentService.deleteDocumentComment({ documentCommentId, user });

    return res.send({});
  }

  registerApi(router) {
    router.get(
      '/api/v1/document-comments',
      [validateQuery(documentIdParamsOrQuerySchema)],
      (req, res) => this.handleGetDocumentComments(req, res)
    );

    router.put(
      '/api/v1/document-comments',
      jsonParser,
      needsPermission(permissions.CREATE_CONTENT),
      validateBody(putDocumentCommentBodySchema),
      (req, res) => this.handlePutDocumentComment(req, res)
    );

    router.post(
      '/api/v1/document-comments/topic',
      [needsPermission(permissions.MANAGE_PUBLIC_CONTENT), jsonParser, validateBody(postDocumentCommentsTopicBodySchema)],
      (req, res) => this.handlePostDocumentCommentsTopic(req, res)
    );

    router.delete(
      '/api/v1/document-comments/:documentCommentId',
      [needsPermission(permissions.MANAGE_PUBLIC_CONTENT), jsonParser, validateParams(documentCommentIdParamsOrQuerySchema)],
      (req, res) => this.handleDeleteDocumentComment(req, res)
    );

  }
}

export default DocumentCommentController;
