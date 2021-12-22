import joi from 'joi';

export const idOrKeySchema = joi.string().alphanum().min(15).max(30);
export const boolStringSchema = joi.any().valid('true', 'false', true, false);

