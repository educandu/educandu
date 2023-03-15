import joi from 'joi';
import { EVENT_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

const documentRevisionCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null).required(),
  revisionId: idOrKeySchema.required()
});

const documentCommentCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null).required(),
  commentId: idOrKeySchema.required()
});

export const eventTypeSchema = joi.string().valid(...Object.values(EVENT_TYPE));

export const createEventParamsSchema = eventTypeFieldName => joi.alternatives().conditional(eventTypeFieldName, {
  switch: [
    { is: EVENT_TYPE.documentRevisionCreated, then: documentRevisionCreatedParamsSchema },
    { is: EVENT_TYPE.documentCommentCreated, then: documentCommentCreatedParamsSchema }
  ]
});

export const eventDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  type: eventTypeSchema.required(),
  params: createEventParamsSchema('type').required(),
  createdOn: joi.date().required(),
  processedOn: joi.date().allow(null).required(),
  processingErrors: joi.array().items(joi.object()).required()
});
