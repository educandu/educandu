import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

const sectionSchema = joi.object({
  data: joi.object().allow(null).required(),
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
  sections: joi.object().pattern(
    idOrKeySchema,
    sectionSchema
  )
});

export const documentInputIdParamsOrQuerySchema = joi.object({
  documentInputId: idOrKeySchema.required()
});

export const getDocumentInputsCreatedByUserParams = joi.object({
  userId: idOrKeySchema.required()
});

export const getDocumentInputsByDocumentIdParams = joi.object({
  documentId: idOrKeySchema.required()
});

export const getDocumentInputsByRoomIdParams = joi.object({
  roomId: idOrKeySchema.required()
});

export const createDocumentInputDataBodySchema = joi.object({
  documentId: idOrKeySchema.required(),
  documentRevisionId: idOrKeySchema.required(),
  sections: joi.object().pattern(
    idOrKeySchema,
    sectionSchema
  )
});

export const hardDeleteDocumentInputBodySchema = joi.object({
  documentInputId: idOrKeySchema.required()
});
