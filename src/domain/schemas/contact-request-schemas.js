import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const contactRequestDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  fromUserId: idOrKeySchema.required(),
  toUserId: idOrKeySchema.required(),
  contactEmailAddress: joi.string().required(),
  createdOn: joi.date().required(),
  expiresOn: joi.date().required()
});
