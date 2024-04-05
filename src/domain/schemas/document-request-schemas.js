import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { DOCUMENT_REQUEST_TYPE, DAY_OF_WEEK } from '../constants.js';

export const documentRequestDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  documentRevisionId: idOrKeySchema.required(),
  type: joi.valid(...Object.values(DOCUMENT_REQUEST_TYPE)).required(),
  isUserLoggedIn: joi.boolean().required(),
  registeredOn: joi.date().required(),
  registeredOnDayOfWeek: joi.valid(...Object.values(DAY_OF_WEEK)).required()
});

