import joi from 'joi';
import { boolStringSchema, idOrKeySchema } from './shared-schemas.js';

export const getExportsQuerySchema = joi.object({
  databaseSchemaHash: joi.string().required()
});

export const getExportsDocumentQuerySchema = joi.object({
  includeEmails: boolStringSchema,
  toRevision: idOrKeySchema.required(),
  databaseSchemaHash: joi.string().required()
});
