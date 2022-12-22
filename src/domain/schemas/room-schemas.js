import joi from 'joi';
import { ROOM_DOCUMENTS_MODE, ROOM_USER_ROLE } from '../constants.js';
import { emailSchema, idOrKeySchema, slugSchema } from './shared-schemas.js';

export const getRoomMembershipConfirmationParamsSchema = joi.object({
  token: idOrKeySchema.required()
});

export const getRoomsQuerySchema = joi.object({
  userRole: joi.string().valid(...Object.values(ROOM_USER_ROLE)).required()
});

export const postRoomBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema.required(),
  documentsMode: joi.string().valid(...Object.values(ROOM_DOCUMENTS_MODE)).required()
});

export const postRoomInvitationsBodySchema = joi.object({
  roomId: idOrKeySchema.required(),
  emails: joi.array().items(emailSchema).min(1).required()
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

export const patchRoomMetadataBodySchema = joi.object({
  name: joi.string().required(),
  slug: slugSchema.required(),
  documentsMode: joi.string().valid(...Object.values(ROOM_DOCUMENTS_MODE)).required(),
  description: joi.string().allow('')
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

const roomMetadataDBProps = {
  name: joi.string().required(),
  slug: slugSchema.required(),
  description: joi.string().allow('').required(),
  updatedOn: joi.date().required(),
  documentsMode: joi.string().valid(...Object.values(ROOM_DOCUMENTS_MODE)).required()
};

const roomMembersDBProps = {
  members: joi.array().required().items(roomMemberDBSchema)
};

export const roomMetadataDBSchema = joi.object(roomMetadataDBProps);

export const roomMembersDBSchema = joi.object(roomMembersDBProps);

export const roomDocumentsDBSchema = joi.array().required().items(idOrKeySchema);

export const roomDBSchema = joi.object({
  ...roomMetadataDBProps,
  ...roomMembersDBProps,
  _id: idOrKeySchema.required(),
  owner: idOrKeySchema.required(),
  createdBy: idOrKeySchema.required(),
  createdOn: joi.date().required(),
  documents: joi.array().required().items(idOrKeySchema)
});

export const roomInvitationDBSchema = joi.object({
  _id: idOrKeySchema.required(),
  roomId: idOrKeySchema.required(),
  email: joi.string().required(),
  sentOn: joi.date().required(),
  token: idOrKeySchema.required(),
  expiresOn: joi.date().required()
});
