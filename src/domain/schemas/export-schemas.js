import joi from 'joi';
import { boolStringSchema } from './shared-schemas.js';

export const getExportsQuerySchema = joi.object({
  databaseSchemaHash: joi.string().required()
});

export const getExportsDocumentQuerySchema = joi.object({
  includeEmails: boolStringSchema,
  databaseSchemaHash: joi.string().required()
});
