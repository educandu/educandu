import deepEqual from 'fast-deep-equal';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator } from './room-utils.js';

export function checkRevisionOnDocumentCreation({ newRevision, room, user }) {
  if (!hasUserPermission(user, permissions.EDIT_DOC)) {
    throw new Error('User is not allowed to create documents');
  }

  const { publicContext, roomContext } = newRevision;

  if (room) {
    const userIsRoomOwner = isRoomOwner({ room, userId: user._id });
    const userIsRoomOwnerOrInvitedCollaborator = isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id });

    if (roomContext.draft && !userIsRoomOwner) {
      throw new Error('Only room owners can create a draft document');
    }

    if (!userIsRoomOwnerOrInvitedCollaborator) {
      throw new Error('Only room owners or collaborators can create a room document');
    }
  }

  if (!room) {
    const userCanAssignAnyAccreditedEditor = hasUserPermission(user, permissions.MANAGE_ACCREDITED_EDITORS);
    const userCanAssignSelfAsAccreditedEditor = hasUserPermission(user, permissions.PROTECT_OWN_DOC);
    const userCanProtectOwnNewDoc = hasUserPermission(user, permissions.PROTECT_OWN_DOC);
    const userCanProtectAnyDoc = hasUserPermission(user, permissions.PROTECT_ANY_DOC);
    const userCanArchiveDoc = hasUserPermission(user, permissions.ARCHIVE_DOC);
    const userCanVerifyDoc = hasUserPermission(user, permissions.VERIFY_DOC);
    const userCanReviewDoc = hasUserPermission(user, permissions.REVIEW_DOC);

    const { accreditedEditors } = publicContext;
    if (accreditedEditors.length) {
      const userIsOnlyAccreditedEditor = accreditedEditors.length === 1 && accreditedEditors[0] === user._id;

      if (!userIsOnlyAccreditedEditor && !userCanAssignAnyAccreditedEditor) {
        throw new Error('User is not allowed to assign accredited editors');
      }

      if (userIsOnlyAccreditedEditor && !userCanAssignAnyAccreditedEditor && !userCanAssignSelfAsAccreditedEditor) {
        throw new Error('User is not allowed to assign themselves as accredited editor');
      }
    }

    if (publicContext.protected && !userCanProtectAnyDoc && !userCanProtectOwnNewDoc) {
      throw new Error('User is not allowed to create a protected document');
    }

    if (publicContext.archived && !userCanArchiveDoc) {
      throw new Error('User is not allowed to create an archived document');
    }

    if (publicContext.verified && !userCanVerifyDoc) {
      throw new Error('User is not allowed to create a verified document');
    }

    if (publicContext.review && !userCanReviewDoc) {
      throw new Error('User is not allowed to create a document with review');
    }
  }
}

export function checkRevisionOnDocumentUpdate({ previousRevision, newRevision, room, user }) {
  if (!hasUserPermission(user, permissions.EDIT_DOC)) {
    throw new Error('User is not allowed to update documents');
  }

  const { publicContext: previousPublicContext, roomContext: previousRoomContext } = previousRevision;
  const { publicContext: newPublicContext } = newRevision;

  if (previousRevision.roomId !== newRevision.roomId) {
    throw new Error('Documents cannot be moved between rooms or public space');
  }

  if (room) {
    const userIsRoomOwner = isRoomOwner({ room, userId: user._id });
    const userIsRoomOwnerOrInvitedCollaborator = isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id });

    if (previousRoomContext.draft && !userIsRoomOwner) {
      throw new Error('Only room owners can update a draft document');
    }

    if (!userIsRoomOwnerOrInvitedCollaborator) {
      throw new Error('Only room owners or collaborators can update a room document');
    }
  }

  if (!room) {
    const userIsAccreditedEditorForThisDocument = previousPublicContext.accreditedEditors.includes(user._id);
    const userCanAssignAnyAccreditedEditor = hasUserPermission(user, permissions.MANAGE_ACCREDITED_EDITORS);
    const userCanManageAnyContent = hasUserPermission(user, permissions.MANAGE_CONTENT);
    const userCanProtectAnyDoc = hasUserPermission(user, permissions.PROTECT_ANY_DOC);
    const userCanArchiveDoc = hasUserPermission(user, permissions.ARCHIVE_DOC);
    const userCanVerifyDoc = hasUserPermission(user, permissions.VERIFY_DOC);
    const userCanReviewDoc = hasUserPermission(user, permissions.REVIEW_DOC);

    if (previousPublicContext.protected && !userCanManageAnyContent && !userIsAccreditedEditorForThisDocument) {
      throw new Error('User is not allowed to update a protected document');
    }

    const { accreditedEditors: previousAccreditedEditors } = previousPublicContext;
    const { accreditedEditors: newAccreditedEditors } = newPublicContext;
    if (!deepEqual(previousAccreditedEditors, newAccreditedEditors) && !userCanAssignAnyAccreditedEditor) {
      throw new Error('User is not allowed to update accredited editors');
    }

    if (previousPublicContext.protected !== newPublicContext.protected && !userCanProtectAnyDoc) {
      throw new Error('User is not allowed to change the protected state of a document');
    }

    if (previousPublicContext.archived !== newPublicContext.archived && !userCanArchiveDoc) {
      throw new Error('User is not allowed to change the archived state of a document');
    }

    if (previousPublicContext.verified !== newPublicContext.verified && !userCanVerifyDoc) {
      throw new Error('User is not allowed to change the verified state of a document');
    }

    if (previousPublicContext.review !== newPublicContext.review && !userCanReviewDoc) {
      throw new Error('User is not allowed to update the review of a document');
    }
  }
}
