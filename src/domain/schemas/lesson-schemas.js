import joi from 'joi';
import { LESSON_VIEW_QUERY_PARAM } from '../constants.js';
import { idOrKeySchema, slugSchema, sectionSchema } from './shared-schemas.js';

export const lessonSectionDBSchema = joi.object({
  key: idOrKeySchema.required(),
  type: joi.string().required(),
  content: joi.alternatives().try(
    joi.object().required(),
    joi.any().allow(null).required()
  ).required()
});

export const lessonDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  updatedBy: idOrKeySchema.required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(lessonSectionDBSchema).required(),
  cdnResources: joi.array().items(joi.string()).required(),
  dueOn: joi.date().allow(null)
});

export const getLessonParamsSchema = joi.object({
  lessonId: idOrKeySchema.required()
}).unknown(true);

export const getLessonQuerySchema = joi.object({
  view: joi.string().valid(...Object.values(LESSON_VIEW_QUERY_PARAM)),
  templateLessonId: idOrKeySchema
});

export const postLessonBodySchema = joi.object({
  roomId: idOrKeySchema.required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  dueOn: joi.string().allow('').required()
});

export const patchLessonParamsSchema = joi.object({
  lessonId: idOrKeySchema.required()
});

export const patchLessonMetadataBodySchema = joi.object({
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  dueOn: joi.string().allow('')
});

export const patchLessonSectionsBodySchema = joi.object({
  sections: joi.array().items(sectionSchema)
});

export const deleteLessonParamsSchema = joi.object({
  lessonId: idOrKeySchema.required()
});
