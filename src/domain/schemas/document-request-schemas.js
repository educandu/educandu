import joi from 'joi';
import { ObjectId } from 'mongodb';
import { DAY_OF_WEEK } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

export const documentRequestDBSchema = joi.object({
  _id: joi.object().instance(ObjectId).required(),
  documentId: idOrKeySchema.required(),
  documentRevisionId: idOrKeySchema.required(),
  isWriteRequest: joi.boolean().required(),
  isLoggedInRequest: joi.boolean().required(),
  registeredOn: joi.date().required(),
  registeredOnDayOfWeek: joi.valid(...Object.values(DAY_OF_WEEK)).required()
});

export const getDocumentRequestsForMaintenanceQuerySchema = joi.object({
  registeredFrom: joi.string(),
  registeredUntil: joi.string(),
  daysOfWeek: joi.string()
});
