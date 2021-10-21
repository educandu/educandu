import joi from 'joi';
import { ROLE } from '../roles';

const usernameSchema = joi.string().min(6);
const passwordSchema = joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d).*$/);
const emailSchema = joi.string().case('lower');

export const postUserBodySchema = joi.object({
  username: usernameSchema.required(),
  password: passwordSchema.required(),
  email: emailSchema.required()
});

export const postUserAccountBodySchema = joi.object({
  username: usernameSchema.required(),
  email: emailSchema.required()
});

export const postUserProfileBodySchema = joi.object({
  profile: joi.object({
    city: joi.string().allow(''),
    country: joi.string().allow(''),
    firstName: joi.string().allow(''),
    lastName: joi.string().allow(''),
    postalCode: joi.string().allow(''),
    street: joi.string().allow(''),
    streetSupplement: joi.string().allow('')
  }).required()
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
