import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { hexCodeValidationPattern } from '../../domain/validation-constants.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

export function createDefaultSecondaryTrack(index, t) {
  return {
    name: `[${t('common:secondaryTrack', { number: index + 2 })}]`,
    sourceType: MEDIA_SOURCE_TYPE.internal,
    sourceUrl: '',
    copyrightNotice: '',
    volume: 1
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
    playbackRange: [0, 1],
    volume: 1
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
  return {
    width: 100,
    mainTrack: createDefaultMainTrack(t),
    secondaryTracks: [createDefaultSecondaryTrack(0, t)],
    chapters: [createDefaultChapter(t)]
  };
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
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      volume: joi.number().min(0).max(1).required()

    }).required(),
    secondaryTracks: joi.array().items(joi.object({
      name: joi.string().allow('').required(),
      sourceType: joi.string().valid(...Object.values(MEDIA_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      volume: joi.number().min(0).max(1).required()
    })).required(),
    chapters: joi.array().items(joi.object({
      key: joi.string().required(),
      startPosition: joi.number().min(0).max(1).required(),
      color: joi.string().pattern(hexCodeValidationPattern).required(),
      title: joi.string().allow('').required(),
      text: joi.string().allow('').required()
    })).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
