import { ROOM_LESSONS_MODE } from '../domain/constants.js';

const isRoomOwnerOrCollaborator = ({ room, userId }) => {
  const isOwner = room.owner === userId;
  const isCollaborator = room.lessonsMode === ROOM_LESSONS_MODE.collaborative && room.members.find(m => m.userId === userId);
  return isOwner || isCollaborator;
};

export default {
  isRoomOwnerOrCollaborator
};
