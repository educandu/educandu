import joi from 'joi';
import { idOrKeySchema, slugSchema, sectionSchema, sectionDBSchema } from './shared-schemas.js';

export const lessonDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  createdBy: idOrKeySchema.required(),
  updatedOn: joi.date().required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  sections: joi.array().items(sectionDBSchema).required(),
  cdnResources: joi.array().items(joi.string()).required(),
  schedule: joi.object({
    startsOn: joi.date().required()
  }).allow(null)
});

export const getLessonParamsSchema = joi.object({
  lessonId: idOrKeySchema.required()
}).unknown(true);

export const postLessonBodySchema = joi.object({
  roomId: idOrKeySchema.required(),
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  schedule: joi.object({
    startsOn: joi.string().required()
  }).allow(null)
});

export const patchLessonParamsSchema = joi.object({
  lessonId: idOrKeySchema.required()
});

export const patchLessonMetadataBodySchema = joi.object({
  title: joi.string().required(),
  slug: slugSchema,
  language: joi.string().case('lower').required(),
  schedule: joi.object({
    startsOn: joi.string().required()
  }).allow(null)
});

export const patchLessonSectionsBodySchema = joi.object({
  sections: joi.array().items(sectionSchema)
});
