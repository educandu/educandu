import joi from 'joi';

export const restoreRevisionBodySchema = joi.object({
  documentKey: joi.string().required(),
  revisionId: joi.string().required()
});
