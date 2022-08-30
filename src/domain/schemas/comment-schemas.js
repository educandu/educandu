import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { maxCommentTextLength, maxCommentTopicLength } from '../validation-constants.js';

export const putCommentBodySchema = joi.object({
  documentId: idOrKeySchema.required(),
  topic: joi.string().required(),
  text: joi.string().required()
});

export const postCommentBodySchema = joi.object({
  topic: joi.string().required()
});

export const deleteCommentBodySchema = joi.object({
  commentId: idOrKeySchema.required()
});

export const commentDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  deletedOn: joi.date().allow(null),
  deletedBy: idOrKeySchema.allow(null),
  topic: joi.string().max(maxCommentTopicLength).required(),
  text: joi.string().max(maxCommentTextLength).allow('')
});
