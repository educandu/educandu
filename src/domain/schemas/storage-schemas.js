import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const getCdnObjectsQuerySchema = joi.object({
  parentPath: joi.string(),
  searchTerm: joi.string().min(3),
  recursive: joi.string().valid(true.toString(), false.toString())
});

export const deleteCdnObjectQuerySchema = joi.object({
  path: joi.string()
});

export const postCdnObjectsBodySchema = joi.object({
  parentPath: joi.string().required()
});

export const getStoragePlansQuerySchema = joi.object({
  includeAssignedUserCount: joi.string().valid(true.toString(), false.toString())
});

export const postStoragePlanBodySchema = joi.object({
  name: joi.string().required(),
  maxBytes: joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required()
});

export const patchStoragePlanParamsSchema = joi.object({
  storagePlanId: idOrKeySchema.required()
});

export const patchStoragePlanBodySchema = joi.object({
  name: joi.string().required(),
  maxBytes: joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required()
});

export const deleteStoragePlanParamsSchema = joi.object({
  storagePlanId: idOrKeySchema.required()
});

export const postStoragePlanDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  name: joi.string().required(),
  maxBytes: joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required()
});
