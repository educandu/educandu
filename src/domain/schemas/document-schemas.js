import joi from 'joi';
import { DOC_VIEW_QUERY_PARAM } from '../constants.js';
import { idOrKeySchema, slugSchema } from './shared-schemas.js';
import { maxDocumentRevisionCreatedBecauseLength, maxDocumentShortDescriptionLength } from '../validation-constants.js';

const sectionSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().valid(null).required()
  ).required()
});

export const getSearchableDocumentsTitlesQuerySchema = joi.object({
  query: joi.string().allow('').required()
});

export const getPublicNonArchivedDocumentsByContributingUserParams = joi.object({
  userId: idOrKeySchema.required()
});

export const getPublicNonArchivedDocumentsByContributingUserQuery = joi.object({
  createdOnly: joi.string().valid(false.toString(), true.toString()).optional()
});

export const documentIdParamsOrQuerySchema = joi.object({
  documentId: idOrKeySchema.required()
});

export const patchDocSectionsBodySchema = joi.object({
  sections: joi.array().items(sectionSchema),
  revisionCreatedBecause: joi.string().allow('').max(maxDocumentRevisionCreatedBecauseLength).required()
});

export const publicContextSchema = joi.object({
  allowedEditors: joi.array().items(idOrKeySchema).required(),
  protected: joi.boolean().required(),
  archived: joi.boolean().required(),
  archiveRedirectionDocumentId: idOrKeySchema.allow(null).allow(''),
  verified: joi.boolean().required(),
  review: joi.string().allow(null).allow('').required()
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
  draft: joi.boolean().required(),
  inputSubmittingDisabled: joi.boolean().required()
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
  shortDescription: joi.string().allow('').max(maxDocumentShortDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  tags: joi.array().items(joi.string()).required(),
  sections: joi.array().items(sectionSchema),
  roomId: idOrKeySchema.allow(null).required(),
  publicContext: publicContextConditionalSchema,
  roomContext: roomContextConditionalSchema
});

export const updateDocumentMetadataBodySchema = joi.object({
  metadata: joi.object({
    title: joi.string().required(),
    shortDescription: joi.string().allow('').max(maxDocumentShortDescriptionLength).required(),
    slug: slugSchema.required(),
    language: joi.string().case('lower').required(),
    tags: joi.array().items(joi.string()).required(),
    publicContext: publicContextSchema.allow(null).required(),
    roomContext: roomContextSchema.allow(null).required()
  }),
  revisionCreatedBecause: joi.string().allow('').max(maxDocumentRevisionCreatedBecauseLength).required()
});

export const publishDocumentBodySchema = joi.object({
  metadata: joi.object({
    title: joi.string().required(),
    shortDescription: joi.string().allow('').max(maxDocumentShortDescriptionLength).required(),
    slug: slugSchema.required(),
    language: joi.string().case('lower').required(),
    tags: joi.array().items(joi.string()).required(),
    publicContext: publicContextSchema.required(),
    roomContext: roomContextSchema.allow(null).required()
  })
});

export const restoreRevisionBodySchema = joi.object({
  revisionId: idOrKeySchema.required(),
  revisionRestoredBecause: joi.string().allow('').max(maxDocumentRevisionCreatedBecauseLength).required()
});

export const hardDeleteSectionBodySchema = joi.object({
  documentId: idOrKeySchema.required(),
  sectionKey: idOrKeySchema.required(),
  sectionRevision: idOrKeySchema.required(),
  reason: joi.string().min(3).required(),
  deleteAllRevisions: joi.boolean().required()
});

export const hardDeletePrivateDocumentBodySchema = joi.object({
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
  createdBecause: joi.string().allow('').max(maxDocumentRevisionCreatedBecauseLength).required(),
  title: joi.string().required(),
  shortDescription: joi.string().allow('').max(maxDocumentShortDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  sections: joi.array().items(documentSectionDBSchema).required(),
  restoredFrom: joi.string().allow(null).required(),
  tags: joi.array().items(joi.string()).required(),
  searchTokens: joi.array().items(joi.string()).required(),
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
  shortDescription: joi.string().allow('').max(maxDocumentShortDescriptionLength).required(),
  slug: slugSchema.required(),
  language: joi.string().case('lower').required(),
  sections: joi.array().items(documentSectionDBSchema).required(),
  contributors: joi.array().items(joi.string()).required(),
  tags: joi.array().items(joi.string()).required(),
  searchTokens: joi.array().items(joi.string()).required(),
  publicContext: publicContextConditionalSchema,
  roomContext: roomContextConditionalSchema,
  cdnResources: joi.array().items(joi.string()).required(),
  trackedCdnResources: joi.array().items(joi.string()).required(),
});

export const getDocumentParamsSchema = joi.object({
  documentId: idOrKeySchema.required()
}).unknown(true);

export const getDocumentQuerySchema = joi.object({
  view: joi.string().valid(...Object.values(DOC_VIEW_QUERY_PARAM)),
  templateDocumentId: idOrKeySchema
});

export const getUserContributionsForStatisticsQuerySchema = joi.object({
  contributedFrom: joi.string(),
  contributedUntil: joi.string()
});
