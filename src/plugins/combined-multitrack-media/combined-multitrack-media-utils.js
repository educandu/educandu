import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { MEDIA_ASPECT_RATIO, MULTITRACK_PLAYER_TYPE } from '../../domain/constants.js';

export function createDefaultPlayer1Track() {
  return {
    sourceUrl: '',
    copyrightNotice: '',
    playbackRange: [0, 1]
  };
}

export function createDefaultPlayer2Track() {
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
  const player1Track = createDefaultPlayer1Track();
  const player2Tracks = [createDefaultPlayer2Track()];

  return {
    player1: {
      track: player1Track,
      showVideo: false,
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      posterImage: { sourceUrl: '' },
      initialVolume: 1
    },
    player2: {
      tracks: player2Tracks,
      volumePresets: [createDefaultVolumePreset(t, player2Tracks.length)],
      initialVolume: 1,
      multitrackPlayerType: MULTITRACK_PLAYER_TYPE.default
    },
    note: '',
    width: 100
  };
}

export function validateContent(content) {
  const schema = joi.object({
    player1: joi.object({
      track: joi.object({
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required(),
        playbackRange: joi.array().items(joi.number().min(0).max(1)).required()
      }).required(),
      showVideo: joi.boolean().required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      posterImage: joi.object({
        sourceUrl: joi.string().allow('').required()
      }).required(),
      initialVolume: joi.number().min(0).max(1).required()
    }).required(),
    player2: joi.object({
      tracks: joi.array().items(joi.object({
        key: joi.string().required(),
        name: joi.string().allow('').required(),
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required(),
        playbackRange: joi.array().items(joi.number().min(0).max(1)).required()
      })).unique('key').min(1).required(),
      volumePresets: joi.array().items(joi.object({
        name: joi.string().required(),
        tracks: joi.array().items(joi.number().min(0).max(1)).min(1).required()
      })).min(1).required(),
      initialVolume: joi.number().min(0).max(1).required(),
      multitrackPlayerType: joi.string().valid(...Object.values(MULTITRACK_PLAYER_TYPE)).required(),
    }).required(),
    note: joi.string().allow('').required(),
    width: joi.number().min(0).max(100).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}
