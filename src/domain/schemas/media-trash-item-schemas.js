import joi from 'joi';
import { commonMediaItemProperties } from './shared-schemas.js';
import { mediaLibraryItemDbSchema } from './media-library-item-schemas.js';

export const mediaTrashItemDbSchema = joi.object({
  ...commonMediaItemProperties,
  originalItem: mediaLibraryItemDbSchema.required()
});
