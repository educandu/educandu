import joi from 'joi';

export const getImportsQuerySchema = joi.object({
  importSourceName: joi.string().required(),
  importSourceBaseUrl: joi.string().required(),
  importSourceApiKey: joi.string().required()
});
