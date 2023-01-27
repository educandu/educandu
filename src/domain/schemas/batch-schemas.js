import joi from 'joi';
import { BATCH_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

export const batchIdParamsSchema = joi.object({
  batchId: idOrKeySchema.required()
});

export const batchTypeParamsSchema = joi.object({
  batchType: joi.valid(...Object.values(BATCH_TYPE)).required()
});
