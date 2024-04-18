import express from 'express';
import DocumentRatingService from '../services/document-rating-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { userDocumentRatingParamsSchema, postDocumentRatingBodySchema } from '../domain/schemas/document-rating-schemas.js';

const jsonParser = express.json();

class DocumentRatingController {
  static dependencies = [DocumentRatingService];

  constructor(documentRatingService) {
    this.documentRatingService = documentRatingService;
  }

  async handleGetUserDocumentRating(req, res) {
    const { documentId } = req.params;
    const userDocumentRating = await this.documentRatingService.getUserDocumentRating({ documentId, user: req.user });
    return res.status(200).send(userDocumentRating);
  }

  async handlePostUserDocumentRating(req, res) {
    const { rating } = req.body;
    const { documentId } = req.params;
    const documentRating = await this.documentRatingService.saveUserDocumentRating({ documentId, user: req.user, rating });
    return res.status(201).send({ documentRating });
  }

  async handleDeleteUserDocumentRating(req, res) {
    const { documentId } = req.params;
    const documentRating = await this.documentRatingService.deleteUserDocumentRating({ documentId, user: req.user });
    return res.send({ documentRating });
  }

  registerApi(router) {
    router.get(
      '/api/v1/document-ratings/:documentId/user-ratings',
      needsAuthentication(),
      validateParams(userDocumentRatingParamsSchema),
      (req, res) => this.handleGetUserDocumentRating(req, res)
    );

    router.post(
      '/api/v1/document-ratings/:documentId/user-ratings',
      needsAuthentication(),
      jsonParser,
      validateParams(userDocumentRatingParamsSchema),
      validateBody(postDocumentRatingBodySchema),
      (req, res) => this.handlePostUserDocumentRating(req, res)
    );

    router.delete(
      '/api/v1/document-ratings/:documentId/user-ratings',
      needsAuthentication(),
      validateParams(userDocumentRatingParamsSchema),
      (req, res) => this.handleDeleteUserDocumentRating(req, res)
    );
  }
}

export default DocumentRatingController;
