import joi from 'joi';
import { ROOM_ACCESS_LEVEL } from '../constants.js';
import { idOrKeySchema, slugSchema } from './shared-schemas.js';

export const getRoomMembershipConfirmationParamsSchema = joi.object({
  token: idOrKeySchema.required()
});

export const postRoomBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema,
  access: joi.string().valid(...Object.values(ROOM_ACCESS_LEVEL)).required()
});

export const postRoomInvitationBodySchema = joi.object({
  roomId: idOrKeySchema.required(),
  email: joi.string().required()
});

export const postRoomInvitationConfirmBodySchema = joi.object({
  token: idOrKeySchema.required()
});

export const getRoomParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
}).unknown(true);

export const patchRoomParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const patchRoomBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema,
  description: joi.string().allow('')
});

export const deleteRoomParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const getAuthorizeResourcesAccessParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});
