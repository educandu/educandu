import joi from 'joi';
import { idOrKeySchema, millisecondsStringSchema } from './shared-schemas.js';

export const getTagDetailsParamsSchema = joi.object({
  tag: joi.string().required()
});

export const getUserContributionsDetailsParamsSchema = joi.object({
  userId: idOrKeySchema.required()
});

export const getUserContributionsQuerySchema = joi.object({
  contributedFrom: millisecondsStringSchema,
  contributedUntil: millisecondsStringSchema
});
