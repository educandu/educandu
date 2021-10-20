import joi from 'joi';

export const saveSettingsBodySchema = joi.object({
  settings: joi.object().required()
});
