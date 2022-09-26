import { isRoomOwnerOrCollaborator } from './room-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOCUMENT_ORIGIN } from '../domain/constants.js';

function canEditDocPart({ user, doc, room, validContributionParts }) {
  const isExternalDocument = doc.origin.startsWith(DOCUMENT_ORIGIN.external);
  const docAllowsContributionToPart = validContributionParts.includes(doc.allowedOpenContribution);

  if (isExternalDocument || doc.archived) {
    return false;
  }

  if (room && !isRoomOwnerOrCollaborator({ room, userId: user?._id })) {
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
