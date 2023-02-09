import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';

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

export function createDefaultContent(t) {
  const tracks = [createDefaultTrack()];
  return {
    tracks,
    volumePresets: [createDefaultVolumePreset(t, tracks.length)],
    showVideo: false,
    aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
    posterImage: { sourceUrl: '' },
    width: 100,
    initialVolume: 1
  };
}

export function validateContent(content) {
  const schema = joi.object({
    tracks: joi.object({
      key: joi.string().required(),
      name: joi.string().allow('').required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required()
    }).min(1).required(),
    volumePresets: joi.array().items(joi.object({
      name: joi.string().required(),
      tracks: joi.array().items(joi.number().min(0).max(1)).min(1).required()
    })).min(1).required(),
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
