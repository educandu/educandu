import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';
import { csvToObjects, objectsToCsv } from '../../utils/csv-utils.js';
import { hexCodeValidationPattern } from '../../domain/validation-constants.js';

const chapterSchema = joi.object({
  key: joi.string().required(),
  startPosition: joi.number().min(0).max(1).required(),
  color: joi.string().pattern(hexCodeValidationPattern).required(),
  title: joi.string().allow('').required(),
  text: joi.string().allow('').required()
});

export function createDefaultSecondaryTrack() {
  return {
    name: '',
    sourceUrl: '',
    copyrightNotice: ''
  };
}

export function createDefaultMainTrack() {
  return {
    name: '',
    sourceUrl: '',
    copyrightNotice: '',
    aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
    showVideo: false,
    playbackRange: [0, 1],
    posterImage: {
      sourceUrl: ''
    }
  };
}

export function createDefaultVolumePreset(t, secondaryTracksCount) {
  return {
    name: t('common:defaultVolumePreset'),
    mainTrack: 1,
    secondaryTracks: new Array(secondaryTracksCount).fill(1)
  };
}

export function createDefaultChapter() {
  return {
    key: uniqueId.create(),
    startPosition: 0,
    color: '#6D8BB1',
    title: '',
    text: ''
  };
}

export function createDefaultContent(t) {
  const secondaryTracks = [];

  return {
    width: 100,
    mainTrack: createDefaultMainTrack(),
    secondaryTracks,
    chapters: [createDefaultChapter()],
    initialVolume: 1,
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
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      showVideo: joi.boolean().required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      posterImage: joi.object({
        sourceUrl: joi.string().allow('').required()
      }).required()
    }).required(),
    secondaryTracks: joi.array().items(joi.object({
      name: joi.string().allow('').required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required()
    })).required(),
    chapters: joi.array().items(chapterSchema).required(),
    initialVolume: joi.number().min(0).max(1).required(),
    volumePresets: joi.array().items(joi.object({
      name: joi.string().required(),
      mainTrack: joi.number().min(0).max(1).required(),
      secondaryTracks: joi.array().items(joi.number().min(0).max(1)).required()
    })).min(1).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
