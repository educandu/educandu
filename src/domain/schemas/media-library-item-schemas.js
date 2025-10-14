import joi from 'joi';
import spdxLicenseList from 'spdx-license-list';
import { MAX_SEARCH_QUERY_LENGTH } from '../constants.js';
import { commonMediaItemProperties, idOrKeySchema } from './shared-schemas.js';
import { maxMediaLibraryItemShortDescriptionLength } from '../validation-constants.js';

const licenseSchema = joi.string().valid(...Object.keys(spdxLicenseList));

const mediaLibraryItemMetadataProperties = {
  shortDescription: joi.string().allow('').max(maxMediaLibraryItemShortDescriptionLength).required(),
  languages: joi.array().items(joi.string().case('lower')).required(),
  allRightsReserved: joi.boolean().required(),
  licenses: joi.alternatives().conditional('allRightsReserved', {
    is: true,
    then: joi.array().max(0).items(licenseSchema).required(),
    otherwise: joi.array().min(1).items(licenseSchema).required()
  }),
  tags: joi.array().min(1).items(joi.string()).required()
};

export const mediaLibraryItemDbSchema = joi.object({
  ...commonMediaItemProperties,
  ...mediaLibraryItemMetadataProperties,
  searchTokens: joi.array().min(1).items(joi.string()).required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required()
});

export const mediaLibraryItemMetadataUpdateDbSchema = joi.object({
  ...mediaLibraryItemMetadataProperties,
  searchTokens: joi.array().min(1).items(joi.string()).required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required()
});

export const mediaLibraryItemMetadataBodySchema = joi.object({
  ...mediaLibraryItemMetadataProperties
});

export const mediaLibraryItemIdParamsSchema = joi.object({
  mediaLibraryItemId: idOrKeySchema.required()
});

export const mediaLibraryItemNameParamsSchema = joi.object({
  mediaLibraryItemName: joi.string().required()
});

export const mediaLibraryTagSearchQuerySchema = joi.object({
  query: joi.string().required()
});

export const mediaLibrarySearchQuerySchema = joi.object({
  query: joi.string().min(0).max(MAX_SEARCH_QUERY_LENGTH).required(),
  resourceTypes: joi.string().required()
});

export const mediaLibraryFindParamsSchema = joi.object({
  url: joi.string().required()
});

export const mediaLibraryBulkDeleteBodySchema = joi.object({
  mediaLibraryItemIds: joi.array().items(idOrKeySchema).required()
});
