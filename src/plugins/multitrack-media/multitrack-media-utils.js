import joi from 'joi';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';

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
    secondaryTracks: Array.from({ length: secondaryTracksCount }, () => 1)
  };
}

export function createDefaultContent(t) {
  const secondaryTracks = [];
  return {
    width: 100,
    mainTrack: createDefaultMainTrack(),
    secondaryTracks,
    initialVolume: 1,
    volumePresets: [createDefaultVolumePreset(t, secondaryTracks.length)]
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
    initialVolume: joi.number().min(0).max(1).required(),
    volumePresets: joi.array().items(joi.object({
      name: joi.string().required(),
      mainTrack: joi.number().min(0).max(1).required(),
      secondaryTracks: joi.array().items(joi.number().min(0).max(1)).required()
    })).min(1).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
