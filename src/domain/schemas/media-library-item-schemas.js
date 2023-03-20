import joi from 'joi';
import spdxLicenseList from 'spdx-license-list';
import { RESOURCE_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';
import { maxMediaLibraryItemDescriptionLength } from '../validation-constants.js';

const licenseSchema = joi.string().valid(...Object.keys(spdxLicenseList));

const mediaLibraryItemMetadataProperties = {
  description: joi.string().allow('').max(maxMediaLibraryItemDescriptionLength).required(),
  languages: joi.array().items(joi.string().case('lower')).required(),
  licenses: joi.array().min(1).items(licenseSchema.required()).required(),
  tags: joi.array().min(1).items(joi.string().required()).required()
};

export const mediaLibraryItemDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  resourceType: joi.string().valid(...Object.values(RESOURCE_TYPE)).required(),
  contentType: joi.string().required(),
  size: joi.number().integer().min(0).required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  url: joi.string().required(),
  ...mediaLibraryItemMetadataProperties
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
