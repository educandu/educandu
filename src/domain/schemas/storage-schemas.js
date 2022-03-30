import joi from 'joi';
import { boolStringSchema, idOrKeySchema } from './shared-schemas.js';

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
  prefix: joi.string().required()
});

export const getStoragePlansQuerySchema = joi.object({
  includeAssignedUserCount: joi.string().valid(true.toString(), false.toString())
});

export const postStoragePlanBodySchema = joi.object({
  name: joi.string().required(),
  maxBytes: joi.number().min(0).required()
});

export const patchStoragePlanParamsSchema = joi.object({
  storagePlanId: idOrKeySchema.required()
});

export const patchStoragePlanBodySchema = joi.object({
  name: joi.string().required(),
  maxBytes: joi.number().min(0).required()
});

export const deleteStoragePlanParamsSchema = joi.object({
  storagePlanId: idOrKeySchema.required()
});
