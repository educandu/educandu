import { isRoomOwnerOrInvitedCollaborator } from './room-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION } from '../domain/constants.js';

export const DOCUMENT_EDIT_RESTRICTION_REASON = {
  none: 'none',
  archive: 'archive',
  room: 'room',
  openContribution: 'open-controbution'
};

function getEditDocPartRestrictionReason({ user, doc, room, validContributionParts }) {
  if (doc.publicContext?.archived) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.archive;
  }

  if (room && !isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id })) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.room;
  }

  const docAllowsContributionToPart = validContributionParts.includes(doc.publicContext?.allowedOpenContribution);
  if (!room && !hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION) && !docAllowsContributionToPart) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.openContribution;
  }

  return DOCUMENT_EDIT_RESTRICTION_REASON.none;
}

function getEditDocContentRestrictionReason({ user, doc, room }) {
  return getEditDocPartRestrictionReason({
    user,
    doc,
    room,
    validContributionParts: [
      DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content,
      DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
    ]
  });
}

function getEditDocMetadataRestrictionReason({ user, doc, room }) {
  return getEditDocPartRestrictionReason({
    user,
    doc,
    room,
    validContributionParts: [DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent]
  });
}

export function getEditDocContentRestrictionTooltip({ t, user, doc, room }) {
  const restrictionReason = getEditDocContentRestrictionReason({ user, doc, room });
  switch (restrictionReason) {
    case DOCUMENT_EDIT_RESTRICTION_REASON.archive:
      return t('doc:editRestrictionTooltip_archive');
    case DOCUMENT_EDIT_RESTRICTION_REASON.room:
      return t('doc:editRestrictionTooltip_room');
    case DOCUMENT_EDIT_RESTRICTION_REASON.openContribution:
      return t('doc:editRestrictionTooltip_openContribution');
    default:
      return null;
  }
}

export function canEditDocContent({ user, doc, room }) {
  const restrictionReason = getEditDocContentRestrictionReason({ user, doc, room });
  return restrictionReason === DOCUMENT_EDIT_RESTRICTION_REASON.none;
}

export function canEditDocMetadata({ user, doc, room }) {
  const restrictionReason = getEditDocMetadataRestrictionReason({ user, doc, room });
  return restrictionReason === DOCUMENT_EDIT_RESTRICTION_REASON.none;
}
