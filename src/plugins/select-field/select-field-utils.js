
import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { MAXIMUM_MAX_COLUMNS_VALUE, SELECT_FIELD_MODE } from './constants.js';

export function createDefaultItem() {
  return {
    key: uniqueId.create(),
    text: ''
  };
}

export function createDefaultContent() {
  return {
    mode: SELECT_FIELD_MODE.singleSelection,
    label: '',
    maxColumns: 1,
    width: 100,
    items: [createDefaultItem()]
  };
}

export function validateContent(content) {
  const schema = joi.object({
    mode: joi.string().valid(...Object.values(SELECT_FIELD_MODE)).required(),
    label: joi.string().allow('').required(),
    maxColumns: joi.number().integer().min(1).max(MAXIMUM_MAX_COLUMNS_VALUE).required(),
    width: joi.number().integer().min(0).max(100).required(),
    items: joi.array().items(joi.object({
      key: joi.string().required(),
      text: joi.string().allow('').required()
    })).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
