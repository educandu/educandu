import { ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

export const isRoomOwnerOrMember = ({ room, userId }) => {
  const isOwner = room.owner === userId;
  const isMember = room.members.some(m => m.userId === userId);
  return isOwner || isMember;
};

export const isRoomOwnerOrCollaborator = ({ room, userId }) => {
  const isOwner = (room.owner.key || room.owner) === userId;
  const isCollaborator = room.documentsMode === ROOM_DOCUMENTS_MODE.collaborative && room.members.some(m => m.userId === userId);
  return isOwner || isCollaborator;
};

export default {
  isRoomOwnerOrMember,
  isRoomOwnerOrCollaborator
};
