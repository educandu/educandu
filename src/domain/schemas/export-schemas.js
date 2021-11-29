import joi from 'joi';

export const getExportsQuerySchema = joi.object({
  databaseSchemaHash: joi.string().required()
});

export const getExportsDocumentQuerySchema = joi.object({
  fromRevision: joi.string().allow('').allow(null),
  toRevision: joi.string().required(),
  databaseSchemaHash: joi.string().required()
});
