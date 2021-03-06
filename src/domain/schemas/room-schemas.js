import joi from 'joi';
import { idOrKeySchema, slugSchema } from './shared-schemas.js';
import { ROOM_ACCESS, ROOM_DOCUMENTS_MODE } from '../constants.js';

export const getRoomMembershipConfirmationParamsSchema = joi.object({
  token: idOrKeySchema.required()
});

export const postRoomBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema,
  access: joi.string().valid(...Object.values(ROOM_ACCESS)).required(),
  documentsMode: joi.string().valid(...Object.values(ROOM_DOCUMENTS_MODE)).required()
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
  documentsMode: joi.string().valid(...Object.values(ROOM_DOCUMENTS_MODE)).required(),
  description: joi.string().allow('')
});

export const deleteRoomsQuerySchema = joi.object({
  ownerId: idOrKeySchema.required(),
  access: joi.string().valid(...Object.values(ROOM_ACCESS))
});

export const deleteRoomParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const deleteRoomMemberParamsSchema = joi.object({
  roomId: idOrKeySchema.required(),
  memberUserId: idOrKeySchema.required()
});

export const deleteRoomInvitationParamsSchema = joi.object({
  invitationId: idOrKeySchema.required()
});

export const getAuthorizeResourcesAccessParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});
