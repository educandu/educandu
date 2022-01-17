import joi from 'joi';

export const getSearchQuerySchema = joi.object({
  query: joi.string().trim().min(3).required()
});
