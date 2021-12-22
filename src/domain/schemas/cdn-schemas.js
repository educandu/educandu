import joi from 'joi';
import { boolStringSchema } from './shared-schemas.js';

export const getObjectsQuerySchema = joi.object({
  prefix: joi.string(),
  recursive: boolStringSchema
});

export const deleteObjectQuerySchema = joi.object({
  prefix: joi.string()
});

export const deleteObjectParamSchema = joi.object({
  objectName: joi.string()
});

export const postObjectsBodySchema = joi.object({
  prefix: joi.string()
});
