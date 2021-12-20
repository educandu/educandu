import joi from 'joi';
import { ROOM_ACCESS_LEVEL } from '../../common/constants.js';

export const roomSchema = joi.object({
  name: joi.string().required(),
  owner: joi.string().required(),
  access: joi.string().valid(ROOM_ACCESS_LEVEL.private, ROOM_ACCESS_LEVEL.public).required()
});

export const roomInvitationSchema = joi.object({
  roomId: joi.string().required(),
  userId: joi.string().required()
});
