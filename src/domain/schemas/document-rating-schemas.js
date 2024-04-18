import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const ratingParamsSchema = joi.object({
  documentId: idOrKeySchema.required()
});

export const postRatingBodySchema = joi.object({
  value: joi.number().integer().min(1).max(5).required()
});
