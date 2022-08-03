import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

export function createDefaultSecondaryTrack(index, t) {
  return {
    name: `[${t('multitrackMedia:secondaryTrack', { number: index + 1 })}]`,
    sourceType: MEDIA_SOURCE_TYPE.internal,
    sourceUrl: '',
    copyrightNotice: '',
    offsetTimecode: 0,
    volume: 1
  };
}

export function createDefaultMainTrack(t) {
  return {
    name: `[${t('multitrackMedia:mainTrack')}]`,
    sourceType: MEDIA_SOURCE_TYPE.internal,
    sourceUrl: '',
    aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
    showVideo: false,
    copyrightNotice: '',
    playbackRange: [0, 1],
    volume: 1
  };
}

export function createDefaultContent(t) {
  return {
    width: 100,
    mainTrack: createDefaultMainTrack(t),
    secondaryTracks: [createDefaultSecondaryTrack(0, t)]
  };
}
