import joi from 'joi';

export const getTagDetailsParamsSchema = joi.object({
  tag: joi.string().required()
});
