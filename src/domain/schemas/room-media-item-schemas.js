import joi from 'joi';
import { commonMediaItemProperties, idOrKeySchema } from './shared-schemas.js';

export const roomMediaItemDbSchema = joi.object({
  ...commonMediaItemProperties,
  roomId: idOrKeySchema.required()
});
