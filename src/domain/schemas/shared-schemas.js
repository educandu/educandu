import joi from 'joi';

export const idOrKeySchema = joi.string().alphanum().min(15).max(30);
export const boolStringSchema = joi.any().valid('true', 'false', true, false);

export const slugSchema = joi.string().allow('').required();

export const sectionSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().valid(null).required()
  ).required()
});
