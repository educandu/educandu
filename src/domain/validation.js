import joi from 'joi';

export const defaultValidationOptions = {
  abortEarly: false,
  allowUnknown: false,
  convert: false,
  dateFormat: 'iso',
  noDefaults: true,
  presence: 'optional',
  stripUnknown: false
};

export function validate(data, schema, validationOptions = defaultValidationOptions) {
  return joi.attempt(data, schema, validationOptions);
}
