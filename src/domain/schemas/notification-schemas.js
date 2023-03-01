import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { NOTIFICATION_REASON } from '../constants.js';
import { eventTypeSchema, createEventParamsSchema } from './event-schemas.js';

export const notificationDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  notifiedUserId: idOrKeySchema.required(),
  eventId: idOrKeySchema.required(),
  eventType: eventTypeSchema.required(),
  eventParams: createEventParamsSchema('eventType').required(),
  reasons: joi.array().items(joi.string().valid(...Object.values(NOTIFICATION_REASON))).required(),
  createdOn: joi.date().required(),
  expiresOn: joi.date().required(),
  readOn: joi.date().allow(null).required()
});
