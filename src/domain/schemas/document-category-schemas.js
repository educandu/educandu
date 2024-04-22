import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { maxDocumentCategoryNameLength } from '../validation-constants.js';

export const documentCategoryDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  name: joi.string().max(maxDocumentCategoryNameLength).required(),
  iconUrl: joi.string().allow('').required(),
  description: joi.string().allow('').required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  documentIds: joi.array().items(idOrKeySchema).required(),
  cdnResources: joi.array().items(joi.string()).required()
});

export const postCategoryCreationRequestBodySchema = joi.object({
  name: joi.string().required(),
  iconUrl: joi.string().allow('').required(),
  description: joi.string().allow('').required()
});
