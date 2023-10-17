import joi from 'joi';
import { RESOURCE_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

export const documentInputMediaItemDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.required(),
  documentInputId: idOrKeySchema.required(),
  resourceType: joi.string().valid(...Object.values(RESOURCE_TYPE)).required(),
  contentType: joi.string().required(),
  size: joi.number().integer().min(0).required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  url: joi.string().required()
});
