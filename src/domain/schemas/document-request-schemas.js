import joi from 'joi';
import { DAY_OF_WEEK } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';
import { dateToNumericDay } from '../../utils/date-utils.js';

const MIN_DAY_NUMBER = dateToNumericDay(new Date('0000-01-01T00:00:00.000Z'));
const MAX_DAY_NUMBER = dateToNumericDay(new Date('2999-12-31T23:59:59.999Z'));

export const documentRequestDbInsertSchema = joi.object({
  documentId: idOrKeySchema.required(),
  day: joi.number().integer().min(MIN_DAY_NUMBER).max(MAX_DAY_NUMBER).required(),
  dayOfWeek: joi.valid(...Object.values(DAY_OF_WEEK)).required(),
  totalCount: joi.number().integer().min(0).required(),
  readCount: joi.number().integer().min(0).required(),
  writeCount: joi.number().integer().min(0).required(),
  anonymousCount: joi.number().integer().min(0).required(),
  loggedInCount: joi.number().integer().min(0).required(),
  expiresOn: joi.date().required()
});
