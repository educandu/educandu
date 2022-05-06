import { MEDIA_TYPE } from '../domain/constants.js';

const audioUrlExtensions = ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'flac'];
const videoUrlExtensions = ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg', 'mov', 'avi', 'mkv'];

export const getMediaType = url => {
  const sanitizedUrl = (url || '').trim();
  const extensionMatches = sanitizedUrl.match(/\.([0-9a-z]+)$/i);
  const extension = extensionMatches?.[1]?.toLowerCase();

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

export function formatMillisecondsAsDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 1) {
    return '00:00';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  const hours = totalHours.toString().padStart(2, '0');

  return totalHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}
