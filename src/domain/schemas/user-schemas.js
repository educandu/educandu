import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { FAVORITE_TYPE, ROLE } from '../constants.js';
import { minPasswordLength, minDisplayNameLength, passwordValidationPattern, maxDisplayNameLength } from '../validation-constants.js';

const emailSchema = joi.string().case('lower');
const passwordSchema = joi.string().min(minPasswordLength).pattern(passwordValidationPattern);
const displayNameSchema = joi.string().min(minDisplayNameLength).max(maxDisplayNameLength);

export const postUserBodySchema = joi.object({
  email: emailSchema.required(),
  password: passwordSchema.required(),
  displayName: displayNameSchema.required()
});

export const postUserAccountBodySchema = joi.object({
  email: emailSchema.required()
});

export const postUserProfileBodySchema = joi.object({
  displayName: displayNameSchema.required(),
  organization: joi.string().allow(''),
  introduction: joi.string().allow('')
});

export const postUserPasswordResetRequestBodySchema = joi.object({
  email: emailSchema.required()
});

export const postUserPasswordResetCompletionBodySchema = joi.object({
  passwordResetRequestId: joi.string().required(),
  password: passwordSchema.required()
});

export const postUserRolesBodySchema = joi.object({
  roles: joi.array().items(joi.string().valid(...Object.values(ROLE))).min(1).required()
});

export const postUserLockedOutBodySchema = joi.object({
  lockedOut: joi.boolean().required()
});

export const postUserStoragePlanBodySchema = joi.object({
  storagePlanId: idOrKeySchema.allow(null).required()
});

export const userIdParamsSchema = joi.object({
  userId: idOrKeySchema.required()
});

export const favoriteBodySchema = joi.object({
  type: joi.string().valid(...Object.values(FAVORITE_TYPE)).required(),
  id: idOrKeySchema.required()
});

export const loginBodySchema = joi.object({
  email: joi.string().required(),
  password: joi.string().required()
});

const storageReminderDBSchema = joi.object({
  timestamp: joi.date().required(),
  createdBy: idOrKeySchema.required()
});

const storageDBSchema = joi.object({
  planId: joi.string().allow(null).required(),
  usedBytes: joi.number().required(),
  reminders: joi.array().required().items(storageReminderDBSchema)
});

export const favoriteDBSchema = joi.object({
  type: joi.string().valid(...Object.values(FAVORITE_TYPE)).required(),
  id: idOrKeySchema.required(),
  setOn: joi.date().required()
});

export const userDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  provider: joi.string().required(),
  passwordHash: joi.string().allow(null).required(),
  email: joi.string().case('lower').allow(null).required(),
  roles: joi.array().required().items(joi.string()),
  expires: joi.date().allow(null).required(),
  verificationCode: joi.string().allow(null).required(),
  lockedOut: joi.bool().required(),
  storage: storageDBSchema.required(),
  favorites: joi.array().required().items(favoriteDBSchema),
  accountClosedOn: joi.date().allow(null).required(),
  displayName: joi.string().required(),
  introduction: joi.string().allow('').required(),
  organization: joi.string().allow('').required()
});
