import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { maxDocumentCategoryNameLength } from '../validation-constants.js';

export const getDocumentCategoryPageParamsSchema = joi.object({
  documentCategoryId: idOrKeySchema.required()
}).unknown(true);

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

export const documentCategoryIdParamsSchema = joi.object({
  documentCategoryId: idOrKeySchema.required()
});

export const postDocumentCategoryBodySchema = joi.object({
  name: joi.string().required(),
  iconUrl: joi.string().allow('').required(),
  description: joi.string().allow('').required()
});

export const patchDocumentCategoryDocumentsBodySchema = joi.object({
  documentIds: joi.array().items(idOrKeySchema).required()
});
