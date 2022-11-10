import joi from 'joi';
import { emailValidationPattern, slugValidationPattern } from '../validation-constants.js';

export const idOrKeySchema = joi.string().alphanum().min(15).max(30);

export const boolStringSchema = joi.any().valid('true', 'false', true, false);

export const slugSchema = joi.string().pattern(slugValidationPattern).allow('');

export const emailSchema = joi.string().pattern(emailValidationPattern);

export const sectionSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().valid(null).required()
  ).required()
});
