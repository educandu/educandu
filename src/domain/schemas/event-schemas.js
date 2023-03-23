import joi from 'joi';
import { EVENT_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

const documentRevisionCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  documentRevisionId: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null).required()
});

const documentCommentCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  documentCommentId: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null).required()
});

const roomMessageCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  roomId: idOrKeySchema.required(),
  roomMessageKey: idOrKeySchema.required()
});

export const eventTypeSchema = joi.string().valid(...Object.values(EVENT_TYPE));

export const createEventParamsSchema = eventTypeFieldName => joi.alternatives().conditional(eventTypeFieldName, {
  switch: [
    { is: EVENT_TYPE.documentRevisionCreated, then: documentRevisionCreatedParamsSchema },
    { is: EVENT_TYPE.documentCommentCreated, then: documentCommentCreatedParamsSchema },
    { is: EVENT_TYPE.roomMessageCreated, then: roomMessageCreatedParamsSchema }
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
