import express from 'express';
import httpErrors from 'http-errors';
import permissions from '../domain/permissions.js';
import CommentService from '../services/comment-service.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { documentIdParamsOrQuerySchema } from '../domain/schemas/document-schemas.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { commentIdParamsOrQuerySchema, postCommentBodySchema, putCommentBodySchema } from '../domain/schemas/comment-schemas.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';

const jsonParser = express.json();
const { BadRequest, NotFound, Forbidden } = httpErrors;

class CommentController {
  static get inject() { return [CommentService, DocumentService, ClientDataMappingService]; }

  constructor(commentService, documentService, clientDataMappingService) {
    this.commentService = commentService;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetDocumentComments(req, res) {
    const { documentId } = req.query;

    const comments = await this.commentService.getAllDocumentComments(documentId);
    const mappedComments = await this.clientDataMappingService.mapComments(comments);

    return res.send({ comments: mappedComments });
  }

  async handlePutComment(req, res) {
    const { user } = req;
    const data = req.body;

    const document = await this.documentService.getDocumentById(data.documentId);

    if (!document) {
      throw new BadRequest(`Unknown document id '${data.documentId}'`);
    }

    if (document.origin !== DOCUMENT_ORIGIN.internal) {
      throw new Forbidden('Comments on external documents can not be edited.');
    }

    const comment = await this.commentService.createComment({ data, user });
    const mappedComment = await this.clientDataMappingService.mapComment(comment);
    return res.status(201).send(mappedComment);
  }

  async handlePostComment(req, res) {
    const { topic } = req.body;
    const { commentId } = req.params;

    const comment = await this.commentService.getCommentById(commentId);

    if (!comment || comment.deletedOn) {
      throw new NotFound();
    }

    const updatedComment = await this.commentService.updateComment({ commentId, topic });
    const mappedComment = await this.clientDataMappingService.mapComment(updatedComment);
    return res.status(201).send(mappedComment);
  }

  async handleDeleteComment(req, res) {
    const { user } = req;
    const { commentId } = req.body;

    const comment = await this.commentService.getCommentById(commentId);

    if (!comment || comment.deletedOn) {
      throw new NotFound();
    }

    await this.commentService.deleteComment({ commentId, user });

    return res.send({});
  }

  registerApi(router) {
    router.get(
      '/api/v1/comments',
      [validateQuery(documentIdParamsOrQuerySchema)],
      (req, res) => this.handleGetDocumentComments(req, res)
    );

    router.put(
      '/api/v1/comments',
      jsonParser,
      needsPermission(permissions.CREATE_DOCUMENT_COMMENTS),
      validateBody(putCommentBodySchema),
      (req, res) => this.handlePutComment(req, res)
    );

    router.post(
      '/api/v1/comments/:commentId',
      [needsPermission(permissions.MANAGE_DOCUMENT_COMMENTS), jsonParser, validateParams(commentIdParamsOrQuerySchema), validateBody(postCommentBodySchema)],
      (req, res) => this.handlePostComment(req, res)
    );

    router.delete(
      '/api/v1/comments',
      [needsPermission(permissions.MANAGE_DOCUMENT_COMMENTS), jsonParser, validateBody(commentIdParamsOrQuerySchema)],
      (req, res) => this.handleDeleteComment(req, res)
    );

  }
}

export default CommentController;
