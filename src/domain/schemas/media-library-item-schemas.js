import joi from 'joi';
import spdxLicenseList from 'spdx-license-list';
import { commonMediaItemProperties, idOrKeySchema } from './shared-schemas.js';
import { maxMediaLibraryItemShortDescriptionLength } from '../validation-constants.js';

const licenseSchema = joi.string().valid(...Object.keys(spdxLicenseList));

const mediaLibraryItemMetadataProperties = {
  shortDescription: joi.string().allow('').max(maxMediaLibraryItemShortDescriptionLength).required(),
  languages: joi.array().items(joi.string().case('lower')).required(),
  licenses: joi.array().min(1).items(licenseSchema.required()).required(),
  tags: joi.array().min(1).items(joi.string().required()).required()
};

export const mediaLibraryItemDbSchema = joi.object({
  ...commonMediaItemProperties,
  ...mediaLibraryItemMetadataProperties,
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required()
});

export const mediaLibraryItemMetadataUpdateDbSchema = joi.object({
  ...mediaLibraryItemMetadataProperties,
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required()
});

export const mediaLibraryItemMetadataBodySchema = joi.object({
  ...mediaLibraryItemMetadataProperties
});

export const mediaLibraryItemIdParamsSchema = joi.object({
  mediaLibraryItemId: idOrKeySchema.required()
});

export const mediaLibraryTagSearchQuerySchema = joi.object({
  query: joi.string().required()
});

export const mediaLibrarySearchQuerySchema = joi.object({
  query: joi.string().required(),
  resourceTypes: joi.string().required()
});

export const mediaLibraryFindParamsSchema = joi.object({
  url: joi.string().required()
});
