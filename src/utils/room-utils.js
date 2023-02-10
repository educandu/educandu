import { ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

const getRoomOwnerId = room => {
  const isClientDataMappedOwner = typeof room.owner === 'object';
  return isClientDataMappedOwner ? room.owner._id : room.owner;
};

export const isRoomOwner = ({ room, userId }) => {
  return getRoomOwnerId(room) === userId;
};

const isInvitedRoomMember = ({ room, userId }) => {
  return room.members.some(m => m.userId === userId);
};

export const isRoomOwnerOrInvitedMember = ({ room, userId }) => {
  return isRoomOwner({ room, userId }) || isInvitedRoomMember({ room, userId });
};

export const isRoomOwnerOrInvitedCollaborator = ({ room, userId }) => {
  const isOwner = isRoomOwner({ room, userId });
  const isCollaborator = room.documentsMode === ROOM_DOCUMENTS_MODE.collaborative && isInvitedRoomMember({ room, userId });
  return isOwner || isCollaborator;
};

export const isRoomInvitedCollaborator = ({ room, userId }) => {
  const isOwner = isRoomOwner({ room, userId });
  const isCollaborator = room.documentsMode === ROOM_DOCUMENTS_MODE.collaborative && isInvitedRoomMember({ room, userId });
  return !isOwner && isCollaborator;
};
