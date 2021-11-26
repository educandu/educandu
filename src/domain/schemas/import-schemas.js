import joi from 'joi';
import { idOrKeySchema } from './document-schemas.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';

const importedDocumentSchema = joi.object({
  key: idOrKeySchema.required(),
  title: joi.string().allow('').required(),
  slug: joi.string().allow('').required(),
  language: joi.string().required(),
  updatedOn: joi.string().required(),
  importedRevision: idOrKeySchema.required().allow(null),
  importableRevision: idOrKeySchema.required(),
  importType: joi.string().allow(DOCUMENT_IMPORT_TYPE.add, DOCUMENT_IMPORT_TYPE.update)
});

export const getImportsQuerySchema = joi.object({
  importSourceName: joi.string().required()
});

export const postImportBatchBodySchema = joi.object({
  importSourceName: joi.string().required(),
  documentsToImport: joi.array().required().items(importedDocumentSchema)
});
