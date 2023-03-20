import joi from 'joi';
import httpErrors from 'http-errors';
import validator from 'express-joi-validation';
import { defaultValidationOptions } from './validation.js';

const { BadRequest } = httpErrors;

const baseValidator = validator.createValidator({
  statusCode: 400,
  passError: true,
  joi
});

export function validateParams(schema) {
  return baseValidator.params(schema, { joi: defaultValidationOptions });
}

export function validateQuery(schema) {
  return baseValidator.query(schema, { joi: defaultValidationOptions });
}

export function validateBody(schema) {
  return baseValidator.body(schema, { joi: defaultValidationOptions });
}

export function validateFile(fieldName) {
  return (req, _res, next) => !req[fieldName]
    ? next(new BadRequest(`A file has to be provided in field '${fieldName}'`))
    : next();
}
