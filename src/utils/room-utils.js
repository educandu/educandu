export const isRoomOwner = ({ room, userId }) => {
  return room.ownedBy === userId;
};

const isInvitedRoomMember = ({ room, userId }) => {
  return room.members.some(m => m.userId === userId);
};

export const isRoomOwnerOrInvitedMember = ({ room, userId }) => {
  return isRoomOwner({ room, userId }) || isInvitedRoomMember({ room, userId });
};

export const isRoomOwnerOrInvitedCollaborator = ({ room, userId }) => {
  const isOwner = isRoomOwner({ room, userId });
  const isCollaborator = room.isCollaborative && isInvitedRoomMember({ room, userId });
  return isOwner || isCollaborator;
};

export const isRoomInvitedCollaborator = ({ room, userId }) => {
  const isOwner = isRoomOwner({ room, userId });
  const isCollaborator = room.isCollaborative && isInvitedRoomMember({ room, userId });
  return !isOwner && isCollaborator;
};
