import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const batchIdParamsSchema = joi.object({
  batchId: idOrKeySchema.required()
});
