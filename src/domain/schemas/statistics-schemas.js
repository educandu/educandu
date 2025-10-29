import joi from 'joi';
import { idOrKeySchema, millisecondsStringSchema } from './shared-schemas.js';

export const getTagDetailsParamsSchema = joi.object({
  tag: joi.string().required()
});

export const getDocumentRequestsQuerySchema = joi.object({
  registeredFrom: millisecondsStringSchema,
  registeredUntil: millisecondsStringSchema,
  daysOfWeek: joi.string().pattern(/^1?2?3?4?5?6?7?$/)
});

export const getUserContributionsDetailsParamsSchema = joi.object({
  userId: idOrKeySchema.required()
});

export const getUserContributionsQuerySchema = joi.object({
  contributedFrom: millisecondsStringSchema,
  contributedUntil: millisecondsStringSchema
});
