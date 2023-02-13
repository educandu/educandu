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

export function createDefaultTrack() {
  return {
    key: uniqueId.create(),
    name: '',
    sourceUrl: '',
    copyrightNotice: '',
    playbackRange: [0, 1]
  };
}

export function createDefaultVolumePreset(t, tracksCount) {
  return {
    name: t('common:defaultVolumePreset'),
    tracks: Array.from({ length: tracksCount }, () => 1)
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
  const tracks = [createDefaultTrack()];

  return {
    tracks,
    volumePresets: [createDefaultVolumePreset(t, tracks.length)],
    chapters: [createDefaultChapter()],
    showVideo: false,
    aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
    posterImage: { sourceUrl: '' },
    width: 100,
    initialVolume: 1
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
    tracks: joi.array().items(joi.object({
      key: joi.string().required(),
      name: joi.string().allow('').required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required()
    })).min(1).required(),
    volumePresets: joi.array().items(joi.object({
      name: joi.string().required(),
      tracks: joi.array().items(joi.number().min(0).max(1)).min(1).required()
    })).min(1).required(),
    chapters: joi.array().items(chapterSchema).required(),
    showVideo: joi.boolean().required(),
    aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
    posterImage: joi.object({
      sourceUrl: joi.string().allow('').required()
    }).required(),
    width: joi.number().min(0).max(100).required(),
    initialVolume: joi.number().min(0).max(1).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
