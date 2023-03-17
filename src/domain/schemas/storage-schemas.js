import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const getAllOrPostRoomMediaParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const deleteRoomMediaParamsSchema = joi.object({
  roomId: idOrKeySchema.required(),
  name: joi.string().required()
});

export const getStoragePlansQuerySchema = joi.object({
  includeAssignedUserCount: joi.string().valid(true.toString(), false.toString())
});

export const postStoragePlanBodySchema = joi.object({
  name: joi.string().required(),
  maxBytes: joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required()
});

export const patchOrDeleteStoragePlanParamsSchema = joi.object({
  storagePlanId: idOrKeySchema.required()
});

export const patchStoragePlanBodySchema = joi.object({
  name: joi.string().required(),
  maxBytes: joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required()
});

export const storagePlanDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  name: joi.string().required(),
  maxBytes: joi.number().min(0).max(Number.MAX_SAFE_INTEGER).required()
});
