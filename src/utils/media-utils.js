import { MEDIA_TYPE } from '../domain/constants.js';

const audioUrlExtensions = ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'flac'];
const videoUrlExtensions = ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg', 'mov', 'avi', 'mkv'];

export const getMediaType = url => {
  const sanitizedUrl = (url || '').trim();
  const extensionMatches = sanitizedUrl.match(/\.([0-9a-z]+)$/i);
  const extension = extensionMatches && extensionMatches[1];

  if (!extension) {
    return MEDIA_TYPE.none;
  }
  if (audioUrlExtensions.includes(extension)) {
    return MEDIA_TYPE.audio;
  }
  if (videoUrlExtensions.includes(extension)) {
    return MEDIA_TYPE.video;
  }
  return MEDIA_TYPE.unknown;
};
