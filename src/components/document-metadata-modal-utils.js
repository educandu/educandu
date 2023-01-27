import inputValidators from '../utils/input-validators.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION } from '../domain/constants.js';
import { maxDocumentDescriptionLength, maxDocumentTagLength, minDocumentTagLength } from '../domain/validation-constants.js';

export const DOCUMENT_METADATA_MODAL_MODE = {
  create: 'create',
  update: 'update',
  clone: 'clone'
};

export const CLONING_STRATEGY = {
  none: 'none',
  cloneWithinArea: 'cloneWithinArea',
  crossCloneIntoRoom: 'crossCloneIntoRoom',
  crossCloneIntoPublicArea: 'crossCloneIntoPublicArea'
};

export function getCloningOptions({ mode, documentToClone, availableRooms, t }) {
  if (mode !== DOCUMENT_METADATA_MODAL_MODE.clone) {
    return {
      strategyOptions: [{ label: '', value: CLONING_STRATEGY.none }],
      roomOptions: []
    };
  }

  const roomOptions = availableRooms.filter(room => room._id !== documentToClone.roomId).map(room => ({
    label: room.name,
    value: room._id
  }));

  const strategyOptions = [
    {
      label: documentToClone.roomId
        ? t('cloningStrategy_cloneWithinArea_fromRoom')
        : t('cloningStrategy_cloneWithinArea_fromPublicArea'),
      value: CLONING_STRATEGY.cloneWithinArea
    }
  ];

  strategyOptions.push({
    label: documentToClone.roomId
      ? t('cloningStrategy_crossCloneIntoRoom_fromRoom')
      : t('cloningStrategy_crossCloneIntoRoom_fromPublicArea'),
    value: CLONING_STRATEGY.crossCloneIntoRoom
  });

  if (documentToClone.roomId) {
    strategyOptions.push({
      label: t('cloningStrategy_crossCloneIntoPublicArea'),
      value: CLONING_STRATEGY.crossCloneIntoPublicArea
    });
  }

  return { strategyOptions, roomOptions };
}

export function getAllowedOpenContributionOptions({ t }) {
  return Object.values(DOCUMENT_ALLOWED_OPEN_CONTRIBUTION).map(optionKey => ({
    key: optionKey,
    value: t(`allowedOpenContribution_${optionKey}`)
  }));
}

export function getValidationState({ cloningStrategy, cloningTargetRoomId, title, description, slug, tags, t }) {
  const isValidCloningTargetRoomId = cloningStrategy !== CLONING_STRATEGY.crossCloneIntoRoom || !!cloningTargetRoomId;
  const isValidTitle = !!title.trim();
  const isValidDescription = description.length <= maxDocumentDescriptionLength;
  const isValidSlug = !slug || inputValidators.isValidSlug(slug);
  const areValidTags = tags.every(tag => inputValidators.isValidTag({ tag }));

  return {
    cloningTargetRoomId: {
      required: true,
      validateStatus: isValidCloningTargetRoomId ? 'success' : 'error',
      help: isValidCloningTargetRoomId ? null : t('roomRequired')
    },
    title: {
      required: true,
      validateStatus: isValidTitle ? 'success' : 'error',
      help: isValidTitle ? null : t('titleRequired')
    },
    description: {
      validateStatus: isValidDescription ? 'success' : 'error',
      help: isValidDescription ? null : t('descriptionTooLong', { maxChars: maxDocumentDescriptionLength })
    },
    slug: {
      validateStatus: isValidSlug ? 'success' : 'error',
      help: isValidSlug ? null : t('common:invalidSlug')
    },
    tags: {
      validateStatus: areValidTags ? 'success' : 'error',
      help: areValidTags ? null : t('invalidTags', { minChars: minDocumentTagLength, maxChars: maxDocumentTagLength })
    }
  };
}

export function determineActualTemplateDocumentId({ mode, documentToClone, useTemplateDocument, defaultTemplateDocumentId }) {
  switch (mode) {
    case DOCUMENT_METADATA_MODAL_MODE.clone:
      return documentToClone._id;
    case DOCUMENT_METADATA_MODAL_MODE.create:
      return useTemplateDocument ? defaultTemplateDocumentId : null;
    case DOCUMENT_METADATA_MODAL_MODE.update:
      return null;
    default:
      throw new Error(`Invalid document metadata modal mode: '${mode}'`);
  }
}

export function determineDocumentRoomId({ mode, initialDocumentMetadata, documentToClone, cloningStrategy, cloningTargetRoomId }) {
  switch (mode) {
    case DOCUMENT_METADATA_MODAL_MODE.clone:
      switch (cloningStrategy) {
        case CLONING_STRATEGY.cloneWithinArea:
          return documentToClone.roomId || null;
        case CLONING_STRATEGY.crossCloneIntoRoom:
          return cloningTargetRoomId;
        case CLONING_STRATEGY.crossCloneIntoPublicArea:
          return null;
        default:
          throw new Error(`Invalid cloning strategy: '${cloningStrategy}'`);
      }
    case DOCUMENT_METADATA_MODAL_MODE.create:
    case DOCUMENT_METADATA_MODAL_MODE.update:
      return initialDocumentMetadata.roomId || null;
    default:
      throw new Error(`Invalid document metadata modal mode: '${mode}'`);
  }
}

export function getDialogTitle(mode, t) {
  switch (mode) {
    case DOCUMENT_METADATA_MODAL_MODE.clone:
      return t('cloneDocument');
    case DOCUMENT_METADATA_MODAL_MODE.create:
      return t('newDocument');
    case DOCUMENT_METADATA_MODAL_MODE.update:
      return t('editDocument');
    default:
      throw new Error(`Invalid document metadata modal mode: '${mode}'`);
  }
}

export function getDialogOkButtonText(mode, t) {
  switch (mode) {
    case DOCUMENT_METADATA_MODAL_MODE.clone:
      return t('common:clone');
    case DOCUMENT_METADATA_MODAL_MODE.create:
      return t('common:create');
    case DOCUMENT_METADATA_MODAL_MODE.update:
      return t('common:save');
    default:
      throw new Error(`Invalid document metadata modal mode: '${mode}'`);
  }
}

export function composeTagOptions(initialDocumentTags = [], tagSuggestions = []) {
  const mergedTags = new Set([...initialDocumentTags, ...tagSuggestions]);
  return [...mergedTags].map(tag => ({ key: tag, value: tag }));
}

export function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}
