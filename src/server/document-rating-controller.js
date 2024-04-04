import express from 'express';
import DocumentRatingService from '../services/document-rating-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { postOrDeleteDocumentRatingParamsSchema, postDocumentRatingBodySchema } from '../domain/schemas/document-rating-schemas.js';

const jsonParser = express.json();

class DocumentRatingController {
  static dependencies = [DocumentRatingService];

  constructor(documentRatingService) {
    this.documentRatingService = documentRatingService;
  }

  async handlePostDocumentRating(req, res) {
    const { rating } = req.body;
    const { documentId } = req.params;
    const basicRating = await this.documentRatingService.saveUserDocumentRating({ documentId, user: req.user, rating });
    return res.status(201).send(basicRating);
  }

  async handleDeleteDocumentRating(req, res) {
    const { documentId } = req.params;
    const basicRating = await this.documentRatingService.deleteUserDocumentRating({ documentId, user: req.user });
    return res.send(basicRating);
  }

  registerApi(router) {
    router.post(
      '/api/v1/document-ratings/:documentId',
      needsAuthentication(),
      jsonParser,
      validateParams(postOrDeleteDocumentRatingParamsSchema),
      validateBody(postDocumentRatingBodySchema),
      (req, res) => this.handlePostDocumentRating(req, res)
    );

    router.delete(
      '/api/v1/document-ratings/:documentId',
      needsAuthentication(),
      validateParams(postOrDeleteDocumentRatingParamsSchema),
      (req, res) => this.handleDeleteDocumentRating(req, res)
    );
  }
}

export default DocumentRatingController;
