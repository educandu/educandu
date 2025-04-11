import joi from 'joi';
import { ObjectId } from 'mongodb';

export const searchRequestDBSchema = joi.object({
  _id: joi.object().instance(ObjectId).required(),
  query: joi.string().required(),
  documentMatchCount: joi.number().required(),
  mediaLibraryItemMatchCount: joi.number().required(),
  registeredOn: joi.date().required(),
  expiresOn: joi.date().required()
});

export const getSearchRequestsForStatisticsQuerySchema = joi.object({
  registeredFrom: joi.string(),
  registeredUntil: joi.string()
});
