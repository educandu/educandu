import cloneDeep from './clone-deep.js';
import { isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from './room-utils.js';
import { EVENT_TYPE, FAVORITE_TYPE, NOTIFICATION_REASON } from '../domain/constants.js';

function shouldProcessEvent({ event, documentRevision, document, documentInput, room, notifiedUser }) {
  let dataEntryWasDeleted = false;

  switch (event.type) {
    case EVENT_TYPE.documentRevisionCreated:
      dataEntryWasDeleted = !document || (document.roomId && !room) || (room && !document.roomId) || !documentRevision;
      break;
    case EVENT_TYPE.documentCommentCreated:
      dataEntryWasDeleted = !document || (document.roomId && !room) || (room && !document.roomId);
      break;
    case EVENT_TYPE.roomMessageCreated:
      dataEntryWasDeleted = !room || !room.messages.find(message => message.key === event.params.roomMessageKey);
      break;
    case EVENT_TYPE.documentInputCreated:
    case EVENT_TYPE.documentInputCommentCreated:
      dataEntryWasDeleted = !documentInput || !document || !room;
      break;
    default:
      throw new Error(`Unexpected event type '${event.type}'`);
  }

  if (dataEntryWasDeleted) {
    return false;
  }

  const eventCreatedBeforeUserRegistration = notifiedUser.createdOn > event.createdOn;
  if (eventCreatedBeforeUserRegistration) {
    return false;
  }

  const eventTriggeredByNotifiedUser = event.params.userId === notifiedUser._id;
  if (eventTriggeredByNotifiedUser) {
    return false;
  }

  const draftRoomDocument = documentRevision?.roomContext?.draft || document?.roomContext?.draft;
  if (draftRoomDocument) {
    return false;
  }

  if (room && !isRoomOwnerOrInvitedMember({ room, userId: notifiedUser._id })) {
    return false;
  }

  return true;
}

function collectRoomMembershipReasonsAfterDocumentEvent({ reasons, room, notifiedUser }) {
  if (room && isRoomOwnerOrInvitedMember({ room, userId: notifiedUser._id })) {
    reasons.add(NOTIFICATION_REASON.roomMembership);
  }
}

function collectRoomMembershipReasonsAfterRoomEvent({ reasons, room, notifiedUser }) {
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

function collectFavoriteReasonsAfterRoomEvent({ reasons, roomId, notifiedUser }) {
  for (const favorite of notifiedUser.favorites) {
    if (roomId && favorite.type === FAVORITE_TYPE.room && favorite.id === roomId) {
      reasons.add(NOTIFICATION_REASON.roomFavorite);
    }
  }
}

function collectAuthorReasonAfterDocumentInputEvent({ reasons, documentInput, notifiedUser }) {
  if (documentInput.createdBy === notifiedUser._id) {
    reasons.add(NOTIFICATION_REASON.documentInputAuthor);
  }
}

function collectRoomMembershipReasonsAfterDocumentInputEvent({ reasons, room, notifiedUser }) {
  if (room && isRoomOwnerOrInvitedCollaborator({ room, userId: notifiedUser._id })) {
    reasons.add(NOTIFICATION_REASON.roomMembership);
  }
}

function determineNotificationReasonsForDocumentRevisionCreatedEvent({ event, documentRevision, document, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, documentRevision, document, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectRoomMembershipReasonsAfterDocumentEvent({ reasons, room, notifiedUser });
  collectFavoriteReasonsAfterDocumentEvent({ reasons, event, documentId: document._id, roomId: room?._id || null, notifiedUser });

  return [...reasons];
}

function determineNotificationReasonsForDocumentCommentCreatedEvent({ event, document, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, documentRevision: null, document, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectRoomMembershipReasonsAfterDocumentEvent({ reasons, room, notifiedUser });
  collectFavoriteReasonsAfterDocumentEvent({ reasons, event, documentId: document._id, roomId: room?._id || null, notifiedUser });

  return [...reasons];
}

function determineNotificationReasonsForRoomMessageCreatedEvent({ event, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectRoomMembershipReasonsAfterRoomEvent({ reasons, room, notifiedUser });
  collectFavoriteReasonsAfterRoomEvent({ reasons, roomId: room._id, notifiedUser });

  return [...reasons];
}

function determineNotificationReasonsForDocumentInputCreatedEvent({ event, documentInput, document, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, documentInput, document, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectRoomMembershipReasonsAfterDocumentInputEvent({ reasons, room, notifiedUser });

  return [...reasons];
}

function determineNotificationReasonsForDocumentInputCommentCreatedEvent({ event, documentInput, document, room, notifiedUser }) {
  if (!shouldProcessEvent({ event, documentInput, document, room, notifiedUser })) {
    return [];
  }

  const reasons = new Set();

  collectAuthorReasonAfterDocumentInputEvent({ reasons, documentInput, notifiedUser });
  collectRoomMembershipReasonsAfterDocumentInputEvent({ reasons, room, notifiedUser });

  return [...reasons];
}

function _createGroupKey(notification) {
  switch (notification.eventType) {
    case EVENT_TYPE.documentRevisionCreated:
    case EVENT_TYPE.documentCommentCreated:
      return [notification.eventType, notification.eventParams.documentId].join('|');
    case EVENT_TYPE.roomMessageCreated:
      return [notification.eventType, notification.eventParams.roomId, notification.eventParams.roomMessageKey].join('|');
    case EVENT_TYPE.documentInputCreated:
      return [notification.eventType, notification.eventParams.documentInputId].join('|');
    case EVENT_TYPE.documentInputCommentCreated:
      return [notification.eventType, notification.eventParams.documentInputId, notification.commentKey].join('|');

    default:
      throw new Error(`Unsupported event type '${notification.eventType}'`);
  }
}

function groupNotifications(notifications) {
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

export default {
  groupNotifications,
  determineNotificationReasonsForRoomMessageCreatedEvent,
  determineNotificationReasonsForDocumentCommentCreatedEvent,
  determineNotificationReasonsForDocumentRevisionCreatedEvent,
  determineNotificationReasonsForDocumentInputCreatedEvent,
  determineNotificationReasonsForDocumentInputCommentCreatedEvent
};
