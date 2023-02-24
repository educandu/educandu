import by from 'thenby';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { isRoomOwner, isRoomOwnerOrInvitedMember } from './room-utils.js';

export function groupCommentsByTopic(comments) {
  const commentsSortedAsc = [...comments].sort(by(comment => comment.createdOn, 'asc'));
  const topicsSortedDesc = [...new Set(commentsSortedAsc.map(comment => comment.topic))].reverse();

  const commentGroups = topicsSortedDesc.reduce((accu, topic) => {
    accu[topic] = commentsSortedAsc.filter(comment => comment.topic === topic);
    return accu;
  }, {});

  return commentGroups;
}

export function checkPermissionsOnCommentCreation({ document, room, user }) {
  if (!hasUserPermission(user, permissions.CREATE_DOCUMENT_COMMENTS)) {
    throw new Error('User is not allowed to create comments');
  }

  if (room) {
    const userIsRoomOwner = isRoomOwner({ room, userId: user._id });
    const userIsRoomOwnerOrInvitedMember = isRoomOwnerOrInvitedMember({ room, userId: user?._id });

    if (document.roomContext.draft && !userIsRoomOwner) {
      throw new Error('Only room owners can create a comment for a draft document');
    }

    if (!userIsRoomOwnerOrInvitedMember) {
      throw new Error('Only room owners or members can create a comment for a room document');
    }
  }
}
