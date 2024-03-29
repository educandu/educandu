import mdiffNs from 'mdiff';
import unidiffNs from 'unidiff';
import cloneDeep from './clone-deep.js';
import Logger from '../common/logger.js';
import { prettyPrintValue } from './string-utils.js';
import { parseDiff, tokenize, markEdits } from 'react-diff-view';

const mdiff = mdiffNs.default || mdiffNs;
const unidiff = unidiffNs.default || unidiffNs;

const logger = new Logger(import.meta.url);

export const SECTION_CHANGE_TYPE = {
  unchanged: 'unchanged',
  added: 'added',
  removed: 'removed',
  movedHere: 'movedHere',
  movedUp: 'movedUp',
  movedDown: 'movedDown'
};

// These must not be modified as the diff libraries also use those values!
export const DIFF_TYPE = {
  add: 'add',
  delete: 'delete',
  modify: 'modify'
};

function mapSectionChangeTypeToDiffType(sectionChangeType) {
  switch (sectionChangeType) {
    case SECTION_CHANGE_TYPE.added:
      return DIFF_TYPE.add;
    case SECTION_CHANGE_TYPE.removed:
      return DIFF_TYPE.delete;
    default:
      return DIFF_TYPE.modify;
  }
}

export function getInterleavedSectionsChanges(oldSectionKeys, newSectionKeys) {
  const oldSectionKeySet = new Set(oldSectionKeys);
  const newSectionKeySet = new Set(newSectionKeys);
  const orderedCommonKeysInOldSection = oldSectionKeys.filter(value => newSectionKeySet.has(value));
  const orderedCommonKeysInNewSection = newSectionKeys.filter(value => oldSectionKeySet.has(value));
  const longestCommonSubsequence = mdiff(orderedCommonKeysInOldSection, orderedCommonKeysInNewSection).getLcs();
  const nonMovedSectionKeySet = new Set(longestCommonSubsequence);
  const movedSectionKeySet = new Set(orderedCommonKeysInNewSection.filter(value => !nonMovedSectionKeySet.has(value)));

  const result = [];
  const processedSectionKeys = new Set();
  let indexInOldSections = 0;
  let indexInNewSections = 0;

  while (indexInOldSections < oldSectionKeys.length || indexInNewSections < newSectionKeys.length) {
    const oldSectionKey = oldSectionKeys[indexInOldSections] ?? null;
    const newSectionKey = newSectionKeys[indexInNewSections] ?? null;

    const hasSectionBeenInTheSamePlace = oldSectionKey === newSectionKey;
    const hasSectionBeenAdded = newSectionKey !== null && !oldSectionKeySet.has(newSectionKey);
    const hasSectionBeenDeleted = oldSectionKey !== null && !newSectionKeySet.has(oldSectionKey);
    const hasSectionBeenMovedToHere = newSectionKey !== null && movedSectionKeySet.has(newSectionKey);
    const hasSectionBeenMovedFromHere = oldSectionKey !== null && movedSectionKeySet.has(oldSectionKey);

    if (hasSectionBeenInTheSamePlace) {
      result.push([oldSectionKey, SECTION_CHANGE_TYPE.unchanged]);
      processedSectionKeys.add(oldSectionKey);
      indexInOldSections += 1;
      indexInNewSections += 1;
    } else if (hasSectionBeenAdded) {
      result.push([newSectionKey, SECTION_CHANGE_TYPE.added]);
      processedSectionKeys.add(newSectionKey);
      indexInNewSections += 1;
    } else if (hasSectionBeenDeleted) {
      result.push([oldSectionKey, SECTION_CHANGE_TYPE.removed]);
      processedSectionKeys.add(oldSectionKey);
      indexInOldSections += 1;
    } else if (hasSectionBeenMovedToHere) {
      result.push([newSectionKey, SECTION_CHANGE_TYPE.movedHere]);
      processedSectionKeys.add(newSectionKey);
      indexInNewSections += 1;
    } else if (hasSectionBeenMovedFromHere) {
      result.push([oldSectionKey, processedSectionKeys.has(oldSectionKey) ? SECTION_CHANGE_TYPE.movedUp : SECTION_CHANGE_TYPE.movedDown]);
      processedSectionKeys.add(oldSectionKey);
      indexInOldSections += 1;
    } else {
      logger.fatal('Unexpected case while creating section diff', { oldSectionKeys, newSectionKeys, indexInOldSections, indexInNewSections });
      return [];
    }
  }

  return result;
}

function getMetadataTextRepresentation(documentRevision) {
  if (!documentRevision) {
    return '';
  }

  const clonedRevision = cloneDeep(documentRevision);

  delete clonedRevision.sections;
  clonedRevision.createdBy = clonedRevision.createdBy._id;
  if (clonedRevision.publicContext) {
    clonedRevision.publicContext.allowedEditors = clonedRevision.publicContext.allowedEditors.map(editor => editor._id);
  }

  return prettyPrintValue(clonedRevision);
}

function getSectionTextRepresentation(section, plugin) {
  if (!section?.content || !plugin) {
    return '';
  }

  return typeof plugin.info.getTextRepresentation === 'function'
    ? plugin.info.getTextRepresentation(section.content) || ''
    : prettyPrintValue(section.content);
}

function createHunksFromChangedText(oldText, newText) {
  const unifiedDiff = unidiff.formatLines(unidiff.diffLines(oldText, newText), { context: Number.MAX_VALUE });
  const [diff] = parseDiff(unifiedDiff, { nearbySequences: 'zip' });
  return diff.hunks;
}

function createPseudoHunksFromUnchangedText(text) {
  const changes = text.split('\n').map((line, index) => ({
    content: line,
    isNormal: true,
    newLineNumber: index + 1,
    oldLineNumber: index + 1,
    type: 'normal'
  }));
  return [
    {
      content: text,
      changes,
      isPlain: false,
      newLines: changes.length,
      newStart: 1,
      oldLines: changes.length,
      oldStart: 1
    }
  ];
}

function createDiff(oldText, newText, type) {
  let hunks;
  if (oldText !== newText) {
    hunks = createHunksFromChangedText(oldText, newText);
  } else if (oldText.length) {
    hunks = createPseudoHunksFromUnchangedText(oldText);
  } else {
    hunks = [];
  }

  let tokens;
  try {
    tokens = hunks ? tokenize(hunks, { highlight: false, enhancers: [markEdits(hunks, { type: 'block' })] }) : null;
  } catch (ex) {
    tokens = null;
  }

  return { type, hunks, tokens };
}

export function createDocumentRevisionComparison(oldDocumentRevision, newDocumentRevision, pluginRegistry) {
  const oldSectionKeys = oldDocumentRevision.sections.map(section => section.key);
  const newSectionKeys = newDocumentRevision.sections.map(section => section.key);
  const oldSectionsByKey = new Map(oldDocumentRevision.sections.map(section => [section.key, section]));
  const newSectionsByKey = new Map(newDocumentRevision.sections.map(section => [section.key, section]));
  const interleavedSectionKeys = getInterleavedSectionsChanges(oldSectionKeys, newSectionKeys);

  const oldMetadataText = getMetadataTextRepresentation(oldDocumentRevision);
  const newMetadataText = getMetadataTextRepresentation(newDocumentRevision);
  const metadataDiff = createDiff(oldMetadataText, newMetadataText, DIFF_TYPE.modify);
  const metadata = {
    key: 'metadata',
    diff: metadataDiff
  };

  const sections = interleavedSectionKeys.map(([sectionKey, changeType]) => {
    const oldSection = changeType === SECTION_CHANGE_TYPE.added ? null : oldSectionsByKey.get(sectionKey);
    const newSection = changeType === SECTION_CHANGE_TYPE.removed ? null : newSectionsByKey.get(sectionKey);
    const sectionType = oldSection?.type || newSection.type;
    const plugin = pluginRegistry.getRegisteredPlugin(sectionType) || null;
    const oldSectionText = getSectionTextRepresentation(oldSection, plugin);
    const newSectionText = getSectionTextRepresentation(newSection, plugin);
    const diffType = mapSectionChangeTypeToDiffType(changeType);
    const diff = createDiff(oldSectionText, newSectionText, diffType);

    return {
      key: [sectionKey, changeType].join('|'),
      targetKey: '',
      diff,
      plugin,
      changeType,
      oldSection,
      newSection,
      sectionType
    };
  });

  for (const section of sections) {
    if (section.changeType === SECTION_CHANGE_TYPE.movedDown || section.changeType === SECTION_CHANGE_TYPE.movedUp) {
      const targetSection = sections.find(s => s.changeType === SECTION_CHANGE_TYPE.movedHere);
      if (targetSection) {
        section.targetKey = targetSection.key;
        targetSection.targetKey = section.key;
      }
    }
  }

  return {
    oldDocumentRevision,
    newDocumentRevision,
    metadata,
    sections
  };
}
