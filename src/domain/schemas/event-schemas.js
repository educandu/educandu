import joi from 'joi';
import { EVENT_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

const revisionCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  revisionId: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null).required()
});

const commentCreatedParamsSchema = joi.object({
  userId: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  commentId: idOrKeySchema.required()
});

export const eventDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  type: joi.string().valid(...Object.values(EVENT_TYPE)).required(),
  params: joi.alternatives().conditional('type', {
    switch: [
      { is: EVENT_TYPE.revisionCreated, then: revisionCreatedParamsSchema },
      { is: EVENT_TYPE.commentCreated, then: commentCreatedParamsSchema }
    ]
  }).required(),
  createdOn: joi.date().required(),
  processedOn: joi.date().allow(null).required()
});
