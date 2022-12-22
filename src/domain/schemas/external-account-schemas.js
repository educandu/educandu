import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const externalAccountDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  providerKey: joi.string().required(),
  externalUserId: joi.string().required(),
  userId: idOrKeySchema.allow(null).required(),
  lastLoggedInOn: joi.date().required(),
  expiresOn: joi.date().required()
});
