import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

const sectionSchema = joi.object({
  data: joi.object().required(),
  comments: joi.array().items(joi.object({
    createdOn: joi.date().required(),
    createdBy: idOrKeySchema.required(),
    deletedOn: joi.date(),
    deletedBy: idOrKeySchema,
    text: joi.string()
  }))
});

export const documentInputDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  documentId: idOrKeySchema.required(),
  documentRevisionId: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  sections: joi.array().items(joi.object().pattern(
    idOrKeySchema,
    sectionSchema
  ))
});
