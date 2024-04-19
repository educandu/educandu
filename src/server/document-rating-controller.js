import express from 'express';
import permissions from '../domain/permissions.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentRatingService from '../services/document-rating-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { ratingParamsSchema, postRatingBodySchema } from '../domain/schemas/document-rating-schemas.js';

const jsonParser = express.json();

class DocumentRatingController {
  static dependencies = [DocumentRatingService];

  constructor(documentRatingService) {
    this.documentRatingService = documentRatingService;
  }

  async handleGetRatingsForMaintenance(_req, res) {
    const documentRatings = await this.documentRatingService.getAllDocumentRatings();
    return res.status(200).send({ documentRatings });
  }

  async handleGetRating(req, res) {
    const { documentId } = req.params;
    const rating = await this.documentRatingService.getRating({ documentId, user: req.user });
    return res.status(200).send(rating);
  }

  async handlePostRating(req, res) {
    const { value } = req.body;
    const { documentId } = req.params;
    const documentRating = await this.documentRatingService.saveRating({ documentId, user: req.user, value });
    return res.status(201).send({ documentRating });
  }

  async handleDeleteRating(req, res) {
    const { documentId } = req.params;
    const documentRating = await this.documentRatingService.deleteRating({ documentId, user: req.user });
    return res.send({ documentRating });
  }

  registerApi(router) {
    router.get(
      '/api/v1/document-ratings/maintenance',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetRatingsForMaintenance(req, res)
    );

    router.get(
      '/api/v1/document-ratings/:documentId/ratings',
      needsAuthentication(),
      validateParams(ratingParamsSchema),
      (req, res) => this.handleGetRating(req, res)
    );

    router.post(
      '/api/v1/document-ratings/:documentId/ratings',
      needsAuthentication(),
      jsonParser,
      validateParams(ratingParamsSchema),
      validateBody(postRatingBodySchema),
      (req, res) => this.handlePostRating(req, res)
    );

    router.delete(
      '/api/v1/document-ratings/:documentId/ratings',
      needsAuthentication(),
      validateParams(ratingParamsSchema),
      (req, res) => this.handleDeleteRating(req, res)
    );
  }
}

export default DocumentRatingController;
