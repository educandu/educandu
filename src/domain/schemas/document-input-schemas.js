import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

const documentInputCommentSchema = joi.object({
  key: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  deletedOn: joi.date().allow(null),
  deletedBy: idOrKeySchema.allow(null),
  text: joi.string().allow('')
});

const sectionSchema = joi.object({
  data: joi.object().allow(null).required(),
  files: joi.array().items(joi.object({
    url: joi.string()
  })).required(),
  comments: joi.array().items(documentInputCommentSchema).required()
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

export const createDocumentInputSectionCommentParams = joi.object({
  documentInputId: idOrKeySchema.required(),
  sectionKey: idOrKeySchema.required()
});

export const createDocumentInputSectionCommentBodySchema = joi.object({
  text: joi.string().required()
});

export const deleteDocumentInputSectionCommentParams = joi.object({
  documentInputId: idOrKeySchema.required(),
  sectionKey: idOrKeySchema.required()
});

export const deleteDocumentInputSectionCommentBodySchema = joi.object({
  commentKey: idOrKeySchema.required()
});

export const hardDeleteDocumentInputBodySchema = joi.object({
  documentInputId: idOrKeySchema.required()
});
