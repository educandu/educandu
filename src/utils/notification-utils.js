import { isRoomOwnerOrInvitedMember } from './room-utils.js';
import { EVENT_TYPE, FAVORITE_TYPE, NOTIFICATION_REASON } from '../domain/constants.js';
import cloneDeep from './clone-deep.js';

function shouldProcessEvent({ event, revision, document, room, notifiedUser }) {
  // Never notify the user for deleted rooms/documents/revisions:
  if (!document || (document.roomId && !room) || (room && !document.roomId) || (event.type === EVENT_TYPE.revisionCreated && !revision)) {
    return false;
  }

  // Never notify the user for events created before they joined:
  if (notifiedUser.createdOn > event.createdOn) {
    return false;
  }

  // Never notify the user that triggered the event:
  if (notifiedUser._id === event.params.userId) {
    return false;
  }

  if (room) {
    let roomContext;
    switch (event.type) {
      case EVENT_TYPE.revisionCreated:
        roomContext = revision.roomContext;
        break;
      case EVENT_TYPE.commentCreated:
        roomContext = document.roomContext;
        break;
      default:
        throw new Error(`Unexpected event type '${event.type}'`);
    }

    // Never notify for draft revisions:
    if (roomContext.draft) {
      return false;
    }

    // Never notify outsiders for room-bound events:
    if (room && !isRoomOwnerOrInvitedMember({ room, userId: notifiedUser._id })) {
      return false;
    }
  }

  return true;
}

function collectRoomMembershipReasonsAfterDocumentEvent({ reasons, room, notifiedUser }) {
  if (room && isRoomOwnerOrInvitedMember({ room, userId: notifiedUser._id })) {
    reasons.add(NOTIFICATION_REASON.roomMembership);
  }
}

function collectFavoriteReasonsAfterDocumentEvent({ reasons, event, documentId, roomId, notifiedUser }) {
  for (const favorite of notifiedUser.favorites) {
    if (roomId && favorite.type === FAVORITE_TYPE.room && favorite.id === roomId) {
      reasons.add(NOTIFICATION_REASON.roomFavorite);
    }

    if (favorite.type === FAVORITE_TYPE.document && favorite.id === documentId) {
      reasons.add(NOTIFICATION_REASON.documentFavorite);
    }

    if (favorite.type === FAVORITE_TYPE.user && favorite.id === event.params.userId) {
      reasons.add(NOTIFICATION_REASON.userFavorite);
    }
  }
}

export function determineNotificationReasonsForRevisionCreatedEvent({ event, revision, document, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, revision, document, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectRoomMembershipReasonsAfterDocumentEvent({ reasons, room, notifiedUser });
  collectFavoriteReasonsAfterDocumentEvent({ reasons, event, documentId: document._id, roomId: room?._id || null, notifiedUser });

  return [...reasons];
}

export function determineNotificationReasonsForCommentCreatedEvent({ event, document, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, revision: null, document, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectRoomMembershipReasonsAfterDocumentEvent({ reasons, room, notifiedUser });
  collectFavoriteReasonsAfterDocumentEvent({ reasons, event, documentId: document._id, roomId: room?._id || null, notifiedUser });

  return [...reasons];
}

function _createGroupKey(notification) {
  switch (notification.eventType) {
    case EVENT_TYPE.revisionCreated:
    case EVENT_TYPE.commentCreated:
      return [notification.eventType, notification.eventParams.documentId].join('|');
    default:
      throw new Error(`Unsupported event type '${notification.eventType}'`);
  }
}

export function groupNotifications(notifications) {
  const groups = [];

  let lastGroupKey = null;
  for (const notification of notifications) {
    const currentGroupKey = _createGroupKey(notification);
    if (currentGroupKey === lastGroupKey) {
      const lastItem = groups[groups.length - 1];
      lastItem.notificationIds.push(notification._id);
      lastItem.lastCreatedOn = notification.createdOn;
    } else {
      groups.push({
        notificationIds: [notification._id],
        eventType: notification.eventType,
        eventParams: cloneDeep(notification.eventParams),
        firstCreatedOn: notification.createdOn,
        lastCreatedOn: notification.createdOn
      });
    }
    lastGroupKey = currentGroupKey;
  }

  return groups;
}
