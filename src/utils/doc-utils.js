import { isRoomOwnerOrInvitedCollaborator } from './room-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION } from '../domain/constants.js';

function canEditDocPart({ user, doc, room, validContributionParts }) {
  const docAllowsContributionToPart = validContributionParts.includes(doc.allowedOpenContribution);

  if (doc.archived) {
    return false;
  }

  if (room && !isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id })) {
    return false;
  }

  if (!room && !hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION) && !docAllowsContributionToPart) {
    return false;
  }

  return true;
}

export function canEditDocContent({ user, doc, room }) {
  return canEditDocPart({
    user,
    doc,
    room,
    validContributionParts: [
      DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content,
      DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
    ]
  });
}

export function canEditDocMetadata({ user, doc, room }) {
  return canEditDocPart({
    user,
    doc,
    room,
    validContributionParts: [DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent]
  });
}
