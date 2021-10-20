import joi from 'joi';

const boolStringSchema = joi.any().allow('true', 'false');

export const getObjectsQuerySchema = joi.object({
  prefix: joi.string(),
  recursive: boolStringSchema
});

export const postObjectsBodySchema = joi.object({
  prefix: joi.string()
});
