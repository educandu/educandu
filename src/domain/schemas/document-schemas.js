import joi from 'joi';
import { maxDocumentDescriptionLength } from '../validation-constants.js';
import { idOrKeySchema, slugSchema, sectionSchema } from './shared-schemas.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOC_VIEW_QUERY_PARAM } from '../constants.js';

export const getSearchableDocumentsTitlesQuerySchema = joi.object({
  query: joi.string().allow('').required()
});

export const getPublicNonArchivedDocumentsByContributingUserParams = joi.object({
  userId: idOrKeySchema.required()
});

export const documentIdParamsOrQuerySchema = joi.object({
  documentId: idOrKeySchema.required()
});

export const patchDocSectionsBodySchema = joi.object({
  sections: joi.array().items(sectionSchema)
});

export const publicContextSchema = joi.object({
  archived: joi.boolean().required(),
  verified: joi.boolean().required(),
  review: joi.string().allow(null).allow('').required(),
  allowedOpenContribution: joi.string().valid(...Object.values(DOCUMENT_ALLOWED_OPEN_CONTRIBUTION)).required()
});

export const publicContextConditionalSchema = joi.alternatives().conditional(
  'roomId',
  {
    is: null,
    then: publicContextSchema.required(),
    otherwise: null
  }
);

export const roomContextSchema = joi.object({
  draft: joi.boolean().required()
});

export const roomContextConditionalSchema = joi.alternatives().conditional(
  'roomId',
  {
    is: idOrKeySchema,
    then: roomContextSchema.required(),
    otherwise: null
  }
);

export const createDocumentDataBodySchema = joi.object({
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  tags: joi.array().items(joi.string()).required(),
  sections: joi.array().items(sectionSchema),
  roomId: idOrKeySchema.allow(null).required(),
  publicContext: publicContextConditionalSchema,
  roomContext: roomContextConditionalSchema
});

export const updateDocumentMetadataBodySchema = joi.object({
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  tags: joi.array().items(joi.string()).required(),
  publicContext: publicContextSchema.allow(null).required(),
  roomContext: roomContextSchema.allow(null).required()
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
  roomId: idOrKeySchema.allow(null).required(),
  order: joi.number().required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  sections: joi.array().items(documentSectionDBSchema).required(),
  restoredFrom: joi.string().allow(null).required(),
  tags: joi.array().items(joi.string()).required(),
  publicContext: publicContextConditionalSchema,
  roomContext: roomContextConditionalSchema,
  cdnResources: joi.array().items(joi.string()).required()
});

export const documentDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.allow(null).required(),
  order: joi.number().required(),
  revision: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  title: joi.string().required(),
  description: joi.string().allow('').max(maxDocumentDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  sections: joi.array().items(documentSectionDBSchema).required(),
  contributors: joi.array().items(joi.string()).required(),
  tags: joi.array().items(joi.string()).required(),
  publicContext: publicContextConditionalSchema,
  roomContext: roomContextConditionalSchema,
  cdnResources: joi.array().items(joi.string()).required()
});

export const getDocumentParamsSchema = joi.object({
  documentId: idOrKeySchema.required()
}).unknown(true);

export const getDocumentQuerySchema = joi.object({
  view: joi.string().valid(...Object.values(DOC_VIEW_QUERY_PARAM)),
  templateDocumentId: idOrKeySchema
});
