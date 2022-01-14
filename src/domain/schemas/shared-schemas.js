import joi from 'joi';

export const idOrKeySchema = joi.string().alphanum().min(15).max(30);
export const boolStringSchema = joi.any().valid('true', 'false', true, false);

export const slugSchema = joi.string().allow('').required();

export const sectionDBSchema = joi.object({
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
