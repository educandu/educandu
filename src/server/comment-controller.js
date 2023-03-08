import express from 'express';
import httpErrors from 'http-errors';
import permissions from '../domain/permissions.js';
import CommentService from '../services/comment-service.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { documentIdParamsOrQuerySchema } from '../domain/schemas/document-schemas.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { commentIdParamsOrQuerySchema, postCommentsTopicBodySchema, putCommentBodySchema } from '../domain/schemas/comment-schemas.js';

const jsonParser = express.json();
const { BadRequest, NotFound } = httpErrors;

class CommentController {
  static dependencies = [CommentService, DocumentService, ClientDataMappingService];

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

    const comment = await this.commentService.createComment({ data, user });
    const mappedComment = await this.clientDataMappingService.mapComment(comment);
    return res.status(201).send(mappedComment);
  }

  async handlePostCommentsTopic(req, res) {
    const { documentId, oldTopic, newTopic } = req.body;

    await this.commentService.updateCommentsTopic({ documentId, oldTopic, newTopic });
    return res.status(201).send();
  }

  async handleDeleteComment(req, res) {
    const { user } = req;
    const { commentId } = req.params;

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
      needsPermission(permissions.CREATE_CONTENT),
      validateBody(putCommentBodySchema),
      (req, res) => this.handlePutComment(req, res)
    );

    router.post(
      '/api/v1/comments/topic',
      [needsPermission(permissions.MANAGE_PUBLIC_CONTENT), jsonParser, validateBody(postCommentsTopicBodySchema)],
      (req, res) => this.handlePostCommentsTopic(req, res)
    );

    router.delete(
      '/api/v1/comments/:commentId',
      [needsPermission(permissions.MANAGE_PUBLIC_CONTENT), jsonParser, validateParams(commentIdParamsOrQuerySchema)],
      (req, res) => this.handleDeleteComment(req, res)
    );

  }
}

export default CommentController;
