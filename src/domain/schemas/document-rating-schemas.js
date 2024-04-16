import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const userDocumentRatingParamsSchema = joi.object({
  documentId: idOrKeySchema.required()
});

export const postDocumentRatingBodySchema = joi.object({
  rating: joi.number().integer().min(1).max(5).required()
});
