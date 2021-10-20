import joi from 'joi';

const idOrKeySchema = joi.string().alphanum().min(15).max(30);

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
  slug: joi.string().pattern(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/).allow('').required(),
  namespace: joi.any().valid('articles').required(),
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionSchema).required(),
  appendTo: documentRevisionAppendToSchema.optional()
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
