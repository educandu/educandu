import joi from 'joi';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';

export function createDefaultSecondaryTrack(index, t) {
  return {
    name: `[${t('common:secondaryTrack', { number: index + 2 })}]`,
    sourceUrl: '',
    copyrightNotice: ''
  };
}

export function createDefaultMainTrack(t) {
  return {
    name: `[${t('common:mainTrack')}]`,
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

export function createDefaultContent(t) {
  const secondaryTracks = [createDefaultSecondaryTrack(0, t)];
  return {
    width: 100,
    mainTrack: createDefaultMainTrack(t),
    secondaryTracks,
    volumePresets: [createDefaultVolumePreset(t, secondaryTracks.count)]
  };
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
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required()
    }).required(),
    secondaryTracks: joi.array().items(joi.object({
      name: joi.string().allow('').required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required()
    })).required(),
    volumePresets: joi.array().items(joi.object({
      name: joi.string().required(),
      mainTrack: joi.number().min(0).max(1).required(),
      secondaryTracks: joi.array().items(joi.number().min(0).max(1)).required()
    })).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
