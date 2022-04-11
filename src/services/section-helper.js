import AES from 'crypto-js/aes.js';
import deepEqual from 'fast-deep-equal';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';

const logger = new Logger(import.meta.url);

function checkPlausibility({ section, ancestorSection = null }) {
  if (!section.key || !section.type) {
    throw new Error('Section key and type must be specified');
  }

  if (ancestorSection && (!ancestorSection.key || !ancestorSection.type)) {
    throw new Error('Ancestor section key and type must be specified');
  }

  if (ancestorSection && ancestorSection.type !== section.type) {
    throw new Error(`Ancestor section has type ${ancestorSection.type} and cannot be changed to ${section.type}`);
  }
}

function createNewSectionRevisionFrom(data) {
  const isDeleted = !data.content;
  return {
    revision: uniqueId.create(),
    key: data.key,
    deletedOn: isDeleted ? new Date(data.deletedOn.getTime()) : null,
    deletedBy: isDeleted ? data.deletedBy : null,
    deletedBecause: isDeleted ? data.deletedBecause : null,
    type: data.type,
    content: isDeleted ? null : cloneDeep(data.content)
  };
}

export function createSectionRevision({ section, ancestorSection = null, isRestoreOperation = false }) {
  checkPlausibility({ section, ancestorSection });

  // If the section has no content, it could be ...
  if (!section.content) {

    // (a) ... the restore of a hard-deleted section
    if (isRestoreOperation) {

      // In this case the date, user and reason have to be defined:
      if (!section.deletedOn || !section.deletedBy || !section.deletedBecause) {
        throw new Error('Restoring a deleted section without deletion information is not allowed');
      }

      // If the deletion information is exactly the same as in the ancestor, we continue the revision:
      if (
        section.deletedOn.getTime() === ancestorSection?.deletedOn?.getTime()
        && section.deletedBy === ancestorSection?.deletedBy
        && section.deletedBecause === ancestorSection?.deletedBecause
      ) {
        logger.info(`Section has not changed compared to ancestor section with revision ${ancestorSection.revision}, using the existing`);
        return cloneDeep(ancestorSection);
      }

      // Otherwise we start a new revision:
      logger.info(`Creating new revision for section key ${section.key}`);
      return createNewSectionRevisionFrom(section);
    }

    // (b) ... the continuation of a hard-deleted ancestor section
    if (!isRestoreOperation && ancestorSection && !ancestorSection.content) {
      return cloneDeep(ancestorSection);
    }

    // All other cases are not allowed
    throw new Error('Sections must specify a content');
  }

  // From here on we can be sure the new section has content!

  // If there is an ancestor section with the same key but the ancestor section has no content ...
  if (ancestorSection && !ancestorSection.content) {

    // ... it could be that we restore an earlier revision of a section before it has been hard-deleted
    if (isRestoreOperation) {

      // In this case we start a new revision:
      logger.info(`Creating new revision for section key ${section.key}`);
      return createNewSectionRevisionFrom(section);
    }

    // For all other cases we do not allow "reviving" sections
    throw new Error(`Ancestor section with key ${section.key} is deleted and cannot be changed`);
  }

  // From here on we can be sure the new section and the ancestor section (if existing) have content!

  // If there is an ancestor section with the same key and it has exactly the same content, we re-use the existing revision
  if (ancestorSection && deepEqual(ancestorSection.content, section.content)) {
    logger.info(`Section has not changed compared to ancestor section with revision ${ancestorSection.revision}, using the existing`);
    return cloneDeep(ancestorSection);
  }

  // Create a new section revision:
  logger.info(`Creating new revision for section key ${section.key}`);
  return createNewSectionRevisionFrom(section);
}

export function extractCdnResources(sections, pluginInfoFactory) {
  return [
    ...sections.reduce((cdnResources, section) => {
      const info = pluginInfoFactory.tryCreateInfo(section.type);
      return info && section.content
        ? [...cdnResources, ...info.getCdnResources(section.content).filter(resource => resource)]
        : cdnResources;
    }, new Set())
  ].sort();
}

function _clipboardEncode(clipboardObject, secretKey) {
  const jsonText = JSON.stringify(clipboardObject || {});
  return AES.encrypt(jsonText, secretKey);
}

function _clipboardDecode(clipboardText, secretKey) {
  try {
    const decryptedText = AES.decrypt(clipboardText, secretKey);
    return JSON.parse(decryptedText);
  } catch {
    return {};
  }
}

function _isValidClipboardObject(clipboardObject) {
  return clipboardObject
    && typeof clipboardObject === 'object'
    && typeof clipboardObject.type === 'string'
    && typeof clipboardObject.content === 'object';
}

export function createClipboardText(section, origin) {
  const clipboardObject = { type: section.type, content: section.content };
  return _clipboardEncode(clipboardObject, origin);
}
