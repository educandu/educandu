import joi from 'joi';
import { ROOM_USER_ROLE } from '../constants.js';
import { maxRoomShortDescriptionLength } from '../validation-constants.js';
import { emailSchema, idOrKeySchema, slugSchema } from './shared-schemas.js';

export const getAllRoomMediaParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const postRoomMediaParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const deleteRoomMediaParamsSchema = joi.object({
  roomId: idOrKeySchema.required(),
  name: joi.string().required()
});

export const getRoomMembershipConfirmationParamsSchema = joi.object({
  token: idOrKeySchema.required()
});

export const getRoomsQuerySchema = joi.object({
  userRole: joi.string().valid(...Object.values(ROOM_USER_ROLE)).required()
});

export const postRoomBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema.required(),
  isCollaborative: joi.boolean().required(),
  shortDescription: joi.string().allow('').required()
});

export const postRoomInvitationsBodySchema = joi.object({
  roomId: idOrKeySchema.required(),
  emails: joi.array().items(emailSchema).min(1).required()
});

export const postRoomInvitationConfirmBodySchema = joi.object({
  token: idOrKeySchema.required()
});

export const postRoomMessageBodySchema = joi.object({
  text: joi.string().required(),
  emailNotification: joi.boolean().required()
});

export const deleteRoomMessageParamsSchema = joi.object({
  roomId: idOrKeySchema.required(),
  messageKey: idOrKeySchema.required()
});

export const getRoomWithSlugParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
}).unknown(true);

export const getRoomParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const patchRoomParamsSchema = joi.object({
  roomId: idOrKeySchema.required()
});

export const patchRoomMetadataBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema.required(),
  isCollaborative: joi.boolean().required(),
  shortDescription: joi.string().allow('')
});

export const patchRoomContentBodySchema = joi.object({
  overview: joi.string().allow('').required()
});

export const patchRoomDocumentsBodySchema = joi.object({
  documentIds: joi.array().items(idOrKeySchema).required()
});

export const deleteRoomsQuerySchema = joi.object({
  ownerId: idOrKeySchema.required()
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

export const roomMemberDBSchema = joi.object({
  userId: idOrKeySchema.required(),
  joinedOn: joi.date().required()
});

export const roomMessageDBSchema = joi.object({
  key: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  text: joi.string().required(),
  emailNotification: joi.boolean().required()
});

const roomMetadataDBProps = {
  name: joi.string().required(),
  slug: slugSchema.required(),
  updatedOn: joi.date().required(),
  isCollaborative: joi.boolean().required(),
  shortDescription: joi.string().allow('').max(maxRoomShortDescriptionLength).required()
};

const roomContentDBProps = {
  overview: joi.string().allow('').required(),
  updatedOn: joi.date().required()
};

const roomMembersDBProps = {
  members: joi.array().required().items(roomMemberDBSchema)
};

const roomMessagesDBProps = {
  messages: joi.array().required().items(roomMessageDBSchema)
};

const roomDocumentsDBProps = {
  documents: joi.array().required().items(idOrKeySchema)
};

export const roomMetadataDBSchema = joi.object(roomMetadataDBProps);

export const roomContentDBSchema = joi.object(roomContentDBProps);

export const roomMembersDBSchema = joi.object(roomMembersDBProps);

export const roomMessagesDBSchema = joi.object(roomMessagesDBProps);

export const roomDocumentsDBSchema = joi.array().required().items(idOrKeySchema);

export const roomDBSchema = joi.object({
  ...roomMetadataDBProps,
  ...roomContentDBProps,
  ...roomMembersDBProps,
  ...roomMessagesDBProps,
  ...roomDocumentsDBProps,
  _id: idOrKeySchema.required(),
  owner: idOrKeySchema.required(),
  createdBy: idOrKeySchema.required(),
  createdOn: joi.date().required()
});

export const roomInvitationDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.required(),
  email: joi.string().required(),
  sentOn: joi.date().required(),
  token: idOrKeySchema.required(),
  expiresOn: joi.date().required()
});
