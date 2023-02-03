import joi from 'joi';
import spdxLicenseList from 'spdx-license-list';
import { RESOURCE_TYPE } from '../constants.js';
import { idOrKeySchema } from './shared-schemas.js';

const licenseSchema = joi.string().valid(...Object.keys(spdxLicenseList));

export const mediaLibraryItemDbSchema = joi.object({
  _id: idOrKeySchema.required(),
  resourceType: joi.string().valid(...Object.values(RESOURCE_TYPE)).required(),
  licenses: joi.array().min(1).items(licenseSchema.required()).required(),
  tags: joi.array().min(1).items(joi.string().required()).required(),
  url: joi.string().required()
});
