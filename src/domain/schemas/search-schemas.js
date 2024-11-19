import joi from 'joi';

export const getSearchQuerySchema = joi.object({
  query: joi.string().trim().min(1).required(),
  tags: joi.string().trim().allow(''),
  type: joi.string(),
  text: joi.string().trim().allow(''),
  sorting: joi.string().trim(),
  direction: joi.string().trim(),
  page: joi.string().trim(),
  pageSize: joi.string().trim()
});
