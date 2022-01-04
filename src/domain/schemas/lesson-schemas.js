import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { slugSchema, sectionDBSchema } from './document-schemas.js';

export const lessonDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionDBSchema).required(),
  cdnResources: joi.array().items(joi.string()).required(),
  schedule: joi.object().allow(null)
});
