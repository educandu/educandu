import joi from 'joi';
import { commonMediaItemProperties, idOrKeySchema } from './shared-schemas.js';

export const documentInputMediaItemDbSchema = joi.object({
  ...commonMediaItemProperties,
  roomId: idOrKeySchema.required(),
  documentInputId: idOrKeySchema.required()
});
