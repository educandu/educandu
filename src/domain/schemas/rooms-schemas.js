import joi from 'joi';
import { idOrKeySchema } from './shared-schemas.js';
import { ROOM_ACCESS_LEVEL } from '../../common/constants.js';

export const postRoomBodySchema = joi.object({
  name: joi.string().required(),
  access: joi.string().valid(ROOM_ACCESS_LEVEL.private, ROOM_ACCESS_LEVEL.public).required()
});

export const postRoomInvitationBodySchema = joi.object({
  roomId: idOrKeySchema.required(),
  email: joi.string().required()
});
