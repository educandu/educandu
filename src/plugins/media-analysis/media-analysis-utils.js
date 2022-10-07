import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { csvToObjects, objectsToCsv } from '../../utils/csv-utils.js';
import { hexCodeValidationPattern } from '../../domain/validation-constants.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

const chapterSchema = joi.object({
  key: joi.string().required(),
  startPosition: joi.number().min(0).max(1).required(),
  color: joi.string().pattern(hexCodeValidationPattern).required(),
  title: joi.string().allow('').required(),
  text: joi.string().allow('').required()
});

export function createDefaultSecondaryTrack(index, t) {
  return {
    name: `[${t('common:secondaryTrack', { number: index + 2 })}]`,
    sourceType: MEDIA_SOURCE_TYPE.internal,
    sourceUrl: '',
    copyrightNotice: ''
  };
}

export function createDefaultMainTrack(t) {
  return {
    name: `[${t('common:mainTrack')}]`,
    sourceType: MEDIA_SOURCE_TYPE.internal,
    sourceUrl: '',
    copyrightNotice: '',
    aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
    showVideo: false,
    playbackRange: [0, 1]
  };
}

export function createDefaultVolumePreset(t, secondaryTracksCount) {
  return {
    name: t('common:defaultVolumePreset'),
    mainTrack: 1,
    secondaryTracks: new Array(secondaryTracksCount).fill(1)
  };
}

export function createDefaultChapter(t) {
  return {
    key: uniqueId.create(),
    startPosition: 0,
    color: '#6D8BB1',
    title: `[${t('common:chapter')}]`,
    text: `[${t('common:text')}]`
  };
}

export function createDefaultContent(t) {
  const secondaryTracks = [];

  return {
    width: 100,
    mainTrack: createDefaultMainTrack(t),
    secondaryTracks,
    chapters: [createDefaultChapter(t)],
    volumePresets: [createDefaultVolumePreset(t, secondaryTracks.count)]
  };
}

export function exportChaptersToCsv(chapters) {
  return objectsToCsv(chapters, ['startPosition', 'title', 'color', 'text']);
}

export async function importChaptersFromCsv(csvStringOrFile) {
  const data = await csvToObjects(csvStringOrFile);

  const chapters = [];

  let lastStartPosition = -1;
  for (let index = 0; index < data.length; index += 1) {
    const row = data[index];
    const chapter = {
      key: uniqueId.create(),
      startPosition: Number(row.startPosition),
      color: String(row.color),
      title: String(row.title),
      text: String(row.text)
    };

    joi.attempt(chapter, chapterSchema, { abortEarly: false, convert: false, noDefaults: true });

    if (index === 0 && chapter.startPosition !== 0) {
      throw new Error('First chapter has to start at position 0');
    }

    if (chapter.startPosition <= lastStartPosition) {
      throw new Error('Invalid start position');
    }

    lastStartPosition = chapter.startPosition;
    chapters.push(chapter);
  }

  if (!chapters.length) {
    throw new Error('There has to be at least one chapter');
  }

  return chapters;
}

export function validateContent(content) {
  const schema = joi.object({
    width: joi.number().min(0).max(100).required(),
    mainTrack: joi.object({
      name: joi.string().allow('').required(),
      sourceType: joi.string().valid(...Object.values(MEDIA_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      showVideo: joi.boolean().required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required()
    }).required(),
    secondaryTracks: joi.array().items(joi.object({
      name: joi.string().allow('').required(),
      sourceType: joi.string().valid(...Object.values(MEDIA_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required()
    })).required(),
    chapters: joi.array().items(chapterSchema).required(),
    volumePresets: joi.array().items(joi.object({
      name: joi.string().required(),
      mainTrack: joi.number().min(0).max(1).required(),
      secondaryTracks: joi.array().items(joi.number().min(0).max(1)).required()
    })).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
