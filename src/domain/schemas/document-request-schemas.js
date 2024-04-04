import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { DOCUMENT_REQUEST_TYPE, DAY_OF_WEEK } from '../constants.js';

export const documentRequestDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  documentRevisionId: idOrKeySchema.required(),
  type: joi.valid(...Object.values(DOCUMENT_REQUEST_TYPE)).required(),
  loggedInUser: joi.boolean().required(),
  createdOn: joi.date().required(),
  createdOnDayOfWeek: joi.valid(...Object.values(DAY_OF_WEEK)).required()
});

