import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';

export const getExportsQuerySchema = joi.object({
  databaseSchemaHash: joi.string().required()
});

export const getExportsDocumentQuerySchema = joi.object({
  toRevision: idOrKeySchema.required(),
  databaseSchemaHash: joi.string().required()
});
