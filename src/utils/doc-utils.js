import by from 'thenby';
import { isRoomOwnerOrInvitedCollaborator } from './room-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { getViewportMeasurementsForElement } from '../ui/browser-helper.js';

const DATA_ATTRIBUTE_SECTION_KEY = 'data-section-key';
const DATA_ATTRIBUTE_SECTION_TYPE = 'data-section-type';
const DATA_ATTRIBUTE_SECTION_REVISION = 'data-section-revision';

const DOCUMENT_EDIT_RESTRICTION_REASON = {
  none: 'none',
  room: 'room',
  archived: 'archived',
  protected: 'protected'
};

function getEditDocRestrictionReason({ user, doc, room }) {
  if (doc.publicContext?.archived) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.archived;
  }

  if (room && !isRoomOwnerOrInvitedCollaborator({ room, userId: user?._id })) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.room;
  }

  if (!room && doc.publicContext.protected && !hasUserPermission(user, permissions.PROTECT_DOC)) {
    return DOCUMENT_EDIT_RESTRICTION_REASON.protected;
  }

  return DOCUMENT_EDIT_RESTRICTION_REASON.none;
}

export function getEditDocRestrictionTooltip({ t, user, doc, room }) {
  if (!user) {
    return t('doc:editRestrictionTooltip_anonymousUser');
  }

  const restrictionReason = getEditDocRestrictionReason({ user, doc, room });
  switch (restrictionReason) {
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

export function canEditDoc({ user, doc, room }) {
  return getEditDocRestrictionReason({ user, doc, room }) === DOCUMENT_EDIT_RESTRICTION_REASON.none;
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
