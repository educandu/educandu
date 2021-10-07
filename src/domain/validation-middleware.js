import joi from 'joi';
import validator from 'express-joi-validation';
import { defaultValidationOptions } from './validation';

const baseValidator = validator.createValidator({
  statusCode: 400,
  passError: true,
  joi
});

export function validateBody(schema) {
  return baseValidator.body(schema, { joi: defaultValidationOptions });
}
