import { isRoomOwnerOrCollaborator } from './room-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { ALLOWED_OPEN_CONTRIBUTION, DOCUMENT_ORIGIN } from '../domain/constants.js';

export function canEditDocContent({ user, doc, room }) {
  const isExternalDocument = doc.origin.startsWith(DOCUMENT_ORIGIN.external);
  const docIsEditable = !isExternalDocument && !doc.archived;
  const docAllowsContentContribution = hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION)
    || doc.allowedOpenContribution === ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
    || doc.allowedOpenContribution === ALLOWED_OPEN_CONTRIBUTION.content;
  const roomDocAllowsContribution = room && user ? isRoomOwnerOrCollaborator({ room, userId: user._id }) : true;

  return docIsEditable && docAllowsContentContribution && roomDocAllowsContribution;
}

export function canEditDocMetadata({ user, doc, room }) {
  const isExternalDocument = doc.origin.startsWith(DOCUMENT_ORIGIN.external);
  const docIsEditable = !isExternalDocument && !doc.archived;
  const docAllowsMetadataContribution = hasUserPermission(user, permissions.RESTRICT_OPEN_CONTRIBUTION)
    || doc.allowedOpenContribution === ALLOWED_OPEN_CONTRIBUTION.metadataAndContent;
  const roomDocAllowsContribution = room && user ? isRoomOwnerOrCollaborator({ room, userId: user._id }) : true;

  return docIsEditable && docAllowsMetadataContribution && roomDocAllowsContribution;
}
