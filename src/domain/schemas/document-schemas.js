import joi from 'joi';
import { idOrKeySchema, slugSchema, sectionDBSchema } from './shared-schemas.js';

const sectionSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().valid(null).required()
  ).required()
});

const documentRevisionAppendToSchema = joi.object({
  key: idOrKeySchema.required(),
  ancestorId: idOrKeySchema.required()
});

export const getRevisionsByKeyQuerySchema = joi.object({
  key: idOrKeySchema.required()
});

export const createRevisionBodySchema = joi.object({
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionSchema).required(),
  appendTo: documentRevisionAppendToSchema.optional(),
  tags: joi.array().items(joi.string()).required(),
  archived: joi.boolean()
});

export const restoreRevisionBodySchema = joi.object({
  documentKey: idOrKeySchema.required(),
  revisionId: idOrKeySchema.required()
});

export const hardDeleteSectionBodySchema = joi.object({
  documentKey: idOrKeySchema.required(),
  sectionKey: idOrKeySchema.required(),
  sectionRevision: idOrKeySchema.required(),
  reason: joi.string().min(3).required(),
  deleteAllRevisions: joi.boolean().required()
});

export const hardDeleteDocumentBodySchema = joi.object({
  documentKey: idOrKeySchema.required()
});

export const documentRevisionDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  key: idOrKeySchema.required(),
  order: joi.number().required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionDBSchema).required(),
  restoredFrom: joi.string().allow(null).allow('').required(),
  tags: joi.array().items(joi.string()).required(),
  archived: joi.bool().required(),
  origin: joi.string().required(),
  originUrl: joi.string().allow(null).allow(''),
  cdnResources: joi.array().items(joi.string()).required()
});

export const documentDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  key: idOrKeySchema.required(),
  order: joi.number().required(),
  revision: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionDBSchema).required(),
  contributors: joi.array().items(joi.string()).required(),
  tags: joi.array().items(joi.string()).required(),
  archived: joi.bool().required(),
  origin: joi.string().required(),
  originUrl: joi.string().allow(null).allow(''),
  cdnResources: joi.array().items(joi.string()).required()
});

export const getDocumentParamsSchema = joi.object({
  docKey: idOrKeySchema.required(),
  docSlug: joi.string()
}).unknown(true);
