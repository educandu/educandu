import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { maxDocumentCommentTextLength, maxDocumentCommentTopicLength } from '../validation-constants.js';

export const putCommentBodySchema = joi.object({
  documentId: idOrKeySchema.required(),
  topic: joi.string().required(),
  text: joi.string().required()
});

export const postCommentsTopicBodySchema = joi.object({
  oldTopic: joi.string().required(),
  newTopic: joi.string().required()
});

export const commentIdParamsOrQuerySchema = joi.object({
  commentId: idOrKeySchema.required()
});

export const commentDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  deletedOn: joi.date().allow(null),
  deletedBy: idOrKeySchema.allow(null),
  topic: joi.string().max(maxDocumentCommentTopicLength).required(),
  text: joi.string().max(maxDocumentCommentTextLength).allow('')
});
