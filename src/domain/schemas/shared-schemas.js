import joi from 'joi';
import { RESOURCE_TYPE } from '../constants.js';
import { emailValidationPattern, slugValidationPattern } from '../validation-constants.js';

export const idOrKeySchema = joi.string().alphanum().min(15).max(30);

export const boolStringSchema = joi.any().valid('true', 'false', true, false);

export const millisecondsStringSchema = joi.string().pattern(/^\d+$/);

export const slugSchema = joi.string().pattern(slugValidationPattern).allow('');

export const emailSchema = joi.string().pattern(emailValidationPattern);

export const commonMediaItemProperties = {
  _id: idOrKeySchema.required(),
  resourceType: joi.string().valid(...Object.values(RESOURCE_TYPE)).required(),
  contentType: joi.string().required(),
  size: joi.number().integer().min(0).required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  name: joi.string().required(),
  url: joi.string().required()
};

export const paginationSchema = joi.object({
  page: joi.string().required(),
  pageSize: joi.string().required()
});
