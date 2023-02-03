import by from 'thenby';
import { isRoomOwnerOrInvitedCollaborator } from './room-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { getViewportMeasurementsForElement } from '../ui/browser-helper.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION } from '../domain/constants.js';

const DATA_ATTRIBUTE_SECTION_KEY = 'data-section-key';
const DATA_ATTRIBUTE_SECTION_TYPE = 'data-section-type';
const DATA_ATTRIBUTE_SECTION_REVISION = 'data-section-revision';

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
