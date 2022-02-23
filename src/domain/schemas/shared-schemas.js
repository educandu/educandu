import joi from 'joi';

export const idOrKeySchema = joi.string().alphanum().min(15).max(30);

export const boolStringSchema = joi.any().valid('true', 'false', true, false);

// Should use `slugValidationPattern` from `validation-constants.js`,
// as soon as we implement https://educandu.atlassian.net/browse/EDU-308
export const slugSchema = joi.string().allow('').required();

export const sectionSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().valid(null).required()
  ).required()
});
