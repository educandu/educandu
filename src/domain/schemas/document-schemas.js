import joi from 'joi';
import { maxDocumentDescriptionLength } from '../validation-constants.js';
import { DOCUMENT_ACCESS, DOC_VIEW_QUERY_PARAM } from '../constants.js';
import { idOrKeySchema, slugSchema, sectionSchema } from './shared-schemas.js';

export const getDocumentsTitlesQuerySchema = joi.object({
  query: joi.string().required()
});

export const documentIdParamsOrQuerySchema = joi.object({
  documentId: idOrKeySchema.required()
});

export const patchDocSectionsBodySchema = joi.object({
  sections: joi.array().items(sectionSchema)
});

export const createDocumentDataBodySchema = joi.object({
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  tags: joi.array().items(joi.string()).required(),
  review: joi.string().allow(null).allow(''),
  sections: joi.array().items(sectionSchema),
  roomId: idOrKeySchema,
  dueOn: joi.string().allow('')
});

export const documentMetadataBodySchema = joi.object({
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  tags: joi.array().items(joi.string()).required(),
  review: joi.string().allow(null).allow(''),
  dueOn: joi.string().allow('')
});

export const restoreRevisionBodySchema = joi.object({
  revisionId: idOrKeySchema.required()
});

export const hardDeleteSectionBodySchema = joi.object({
  documentId: idOrKeySchema.required(),
  sectionKey: idOrKeySchema.required(),
  sectionRevision: idOrKeySchema.required(),
  reason: joi.string().min(3).required(),
  deleteAllRevisions: joi.boolean().required()
});

export const hardDeleteDocumentBodySchema = joi.object({
  documentId: idOrKeySchema.required()
});

export const documentSectionDBSchema = joi.object({
  revision: idOrKeySchema.required(),
  key: idOrKeySchema.required(),
  deletedOn: joi.date().allow(null).required(),
  deletedBy: idOrKeySchema.allow(null).required(),
  deletedBecause: joi.string().allow(null).required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().allow(null).required()
  ).required()
});

export const documentRevisionDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null),
  order: joi.number().required(),
  access: joi.string().valid(...Object.values(DOCUMENT_ACCESS)).required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  dueOn: joi.date().allow(null),
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(documentSectionDBSchema).required(),
  restoredFrom: joi.string().allow(null).allow('').required(),
  tags: joi.array().items(joi.string()).required(),
  review: joi.string().allow(null).allow(''),
  archived: joi.bool().required(),
  origin: joi.string().required(),
  originUrl: joi.string().allow(null).allow(''),
  cdnResources: joi.array().items(joi.string()).required()
});

export const documentDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null),
  order: joi.number().required(),
  access: joi.string().valid(...Object.values(DOCUMENT_ACCESS)).required(),
  revision: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  dueOn: joi.date().allow(null),
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(documentSectionDBSchema).required(),
  contributors: joi.array().items(joi.string()).required(),
  tags: joi.array().items(joi.string()).required(),
  review: joi.string().allow(null).allow(''),
  archived: joi.bool().required(),
  origin: joi.string().required(),
  originUrl: joi.string().allow(null).allow(''),
  cdnResources: joi.array().items(joi.string()).required()
});

export const getDocumentParamsSchema = joi.object({
  documentId: idOrKeySchema.required()
}).unknown(true);

export const getDocumentQuerySchema = joi.object({
  view: joi.string().valid(...Object.values(DOC_VIEW_QUERY_PARAM)),
  templateDocumentId: idOrKeySchema
});
