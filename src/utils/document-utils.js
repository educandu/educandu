import by from 'thenby';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { getViewportMeasurementsForElement } from '../ui/browser-helper.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator } from './room-utils.js';

const DATA_ATTRIBUTE_SECTION_KEY = 'data-section-key';
const DATA_ATTRIBUTE_SECTION_TYPE = 'data-section-type';
const DATA_ATTRIBUTE_SECTION_REVISION = 'data-section-revision';

const DOCUMENT_EDIT_RESTRICTION_REASON = {
  none: 'none',
  room: 'room',
  draft: 'draft',
  archived: 'archived',
  protected: 'protected',
  anonymous: 'anonymous'
};

function userIsAccreditedEditor({ user, doc }) {
  // Check against potentially client-data-mapped user as well as pure string IDs (DB model):
  return (doc.publicContext.accreditedEditors || [])
    .map(item => typeof item === 'object' ? item._id : item)
    .includes(user._id);
}

function getEditDocumentRestrictionReason({ user, doc, room }) {
  if (!doc || (doc.roomId && !room)) {
    throw new Error('Inconsistent arguments');
  }

  if (!user) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.anonymous;
  }

  if (room) {
    if (doc.roomContext.draft && !isRoomOwner({ room, userId: user?._id })) {
      return DOCUMENT_EDIT_RESTRICTION_REASON.draft;
    }

    return isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id })
      ? DOCUMENT_EDIT_RESTRICTION_REASON.none
      : DOCUMENT_EDIT_RESTRICTION_REASON.room;
  }

  if (doc.publicContext.archived) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.archived;
  }

  if (
    doc.publicContext.protected
    && !hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)
    && !userIsAccreditedEditor({ user, doc })
  ) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.protected;
  }

  return DOCUMENT_EDIT_RESTRICTION_REASON.none;
}

export function getEditDocRestrictionTooltip({ t, user, doc, room }) {
  const restrictionReason = getEditDocumentRestrictionReason({ user, doc, room });
  switch (restrictionReason) {
    case DOCUMENT_EDIT_RESTRICTION_REASON.anonymous:
      return t('doc:editRestrictionTooltip_anonymous');
    case DOCUMENT_EDIT_RESTRICTION_REASON.protected:
      return t('doc:editRestrictionTooltip_protected');
    case DOCUMENT_EDIT_RESTRICTION_REASON.archived:
      return t('doc:editRestrictionTooltip_archive');
    case DOCUMENT_EDIT_RESTRICTION_REASON.room:
      return t('doc:editRestrictionTooltip_room');
    default:
      return null;
  }
}

export function getFavoriteActionTooltip({ t, user, doc }) {
  if (!user) {
    return t('favoriteRestrictionTooltip');
  }
  const isFavoriteDocument = user?.favorites.find(favorite => favorite.id === doc._id);
  return isFavoriteDocument ? t('common:removeFavorite') : t('common:addFavorite');
}

export function canEditDocument({ user, doc, room }) {
  return getEditDocumentRestrictionReason({ user, doc, room }) === DOCUMENT_EDIT_RESTRICTION_REASON.none;
}

export function findCurrentlyWorkedOnSectionKey() {
  if (!window.scrollY) {
    return null;
  }

  const measurements = [...window.document.body.querySelectorAll(`[${DATA_ATTRIBUTE_SECTION_KEY}]`)]
    .map(element => ({ element, ...getViewportMeasurementsForElement(element) }));

  if (!measurements.length) {
    return null;
  }

  if (measurements.length === 1) {
    return measurements[0].element.getAttribute(DATA_ATTRIBUTE_SECTION_KEY);
  }

  const firstElementStartingInViewport = measurements.find(m => m.elementTopIsInViewport);
  if (firstElementStartingInViewport) {
    return firstElementStartingInViewport.element.getAttribute(DATA_ATTRIBUTE_SECTION_KEY);
  }

  const elementCoveringMostViewport = measurements.sort(by(x => x.viewportCoverage, 'desc'))[0];
  if (elementCoveringMostViewport) {
    return elementCoveringMostViewport.element.getAttribute(DATA_ATTRIBUTE_SECTION_KEY);
  }

  return null;
}

export function tryBringSectionIntoView(sectionKey) {
  const element = window.document.querySelector(`[${DATA_ATTRIBUTE_SECTION_KEY}="${sectionKey}"]`);
  if (!element) {
    return;
  }

  const measurement = getViewportMeasurementsForElement(element);
  if (!measurement.elementTopIsInViewport) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

export function getSectionElementDataAttributes(section) {
  return {
    [DATA_ATTRIBUTE_SECTION_KEY]: section.key,
    [DATA_ATTRIBUTE_SECTION_TYPE]: section.type,
    [DATA_ATTRIBUTE_SECTION_REVISION]: section.revision
  };
}

export function getDocumentRevisionHistoryVersionInfo(documentRevisions, documentRevisionId) {
  const sortedDocumentRevisions = documentRevisions.sort(by(r => r.createdOn, 'desc'));
  const documentRevisionIndex = sortedDocumentRevisions.findIndex(r => r._id === documentRevisionId);

  return {
    version: documentRevisions.length - documentRevisionIndex,
    isLatestVersion: documentRevisionIndex === 0
  };
}
