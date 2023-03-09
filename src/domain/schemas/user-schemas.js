import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { FAVORITE_TYPE, ROLE, EMAIL_NOTIFICATION_FREQUENCY } from '../constants.js';
import {
  minUserPasswordLength,
  minUserDisplayNameLength,
  passwordValidationPattern,
  maxUserDisplayNameLength,
  maxUserIntroductionLength,
  maxUserOrganizationLength
} from '../validation-constants.js';

const emailSchema = joi.string().case('lower');
const passwordSchema = joi.string().min(minUserPasswordLength).pattern(passwordValidationPattern);
const displayNameSchema = joi.string().min(minUserDisplayNameLength).max(maxUserDisplayNameLength);

export const getUsersBySearchQuerySchema = joi.object({
  query: joi.string().required()
});

export const postUserRegistrationRequestBodySchema = joi.object({
  email: emailSchema.required(),
  password: passwordSchema.required(),
  displayName: displayNameSchema.required()
});

export const postUserRegistrationCompletionBodySchema = joi.object({
  userId: idOrKeySchema.required(),
  verificationCode: idOrKeySchema.required()
});

export const postUserAccountBodySchema = joi.object({
  email: emailSchema.required()
});

export const postUserProfileBodySchema = joi.object({
  displayName: displayNameSchema.required(),
  organization: joi.string().allow(''),
  introduction: joi.string().allow('')
});

export const postUserNotificationSettingsBodySchema = joi.object({
  emailNotificationFrequency: joi.string().valid(...Object.values(EMAIL_NOTIFICATION_FREQUENCY)).required()
});

export const postUserPasswordResetRequestBodySchema = joi.object({
  email: emailSchema.required(),
  password: passwordSchema.required()
});

export const postUserPasswordResetCompletionBodySchema = joi.object({
  passwordResetRequestId: idOrKeySchema.required(),
  verificationCode: idOrKeySchema.required()
});

export const postUserRoleBodySchema = joi.object({
  role: joi.string().valid(...Object.values(ROLE)).required()
});

export const postUserAccountLockedOnBodySchema = joi.object({
  accountLockedOn: joi.string().allow(null).required()
});

export const postUserStoragePlanBodySchema = joi.object({
  storagePlanId: idOrKeySchema.allow(null).required()
});

export const userIdParamsSchema = joi.object({
  userId: idOrKeySchema.required()
});

export const externalAccountIdParamsSchema = joi.object({
  externalAccountId: idOrKeySchema.required()
});

export const favoriteBodySchema = joi.object({
  type: joi.string().valid(...Object.values(FAVORITE_TYPE)).required(),
  id: idOrKeySchema.required()
});

export const loginBodySchema = joi.object({
  email: joi.string().required(),
  password: joi.string().required(),
  connectExternalAccount: joi.boolean().required()
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
  passwordHash: joi.string().allow(null).required(),
  email: joi.string().case('lower').allow(null).required(),
  role: joi.string().valid(...Object.values(ROLE)).required(),
  expiresOn: joi.date().allow(null).required(),
  verificationCode: joi.string().allow(null).required(),
  storage: storageDBSchema.required(),
  favorites: joi.array().required().items(favoriteDBSchema),
  emailNotificationFrequency: joi.string().valid(...Object.values(EMAIL_NOTIFICATION_FREQUENCY)).required(),
  accountLockedOn: joi.date().allow(null).required(),
  accountClosedOn: joi.date().allow(null).required(),
  lastLoggedInOn: joi.date().allow(null).required(),
  displayName: joi.string().required(),
  introduction: joi.string().allow('').max(maxUserIntroductionLength).required(),
  organization: joi.string().allow('').max(maxUserOrganizationLength).required()
});
