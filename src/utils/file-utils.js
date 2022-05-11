import { FILE_TYPE } from '../domain/constants.js';

const extensionsGroups = [
  { type: FILE_TYPE.pdf, extensions: ['pdf'] },
  { type: FILE_TYPE.text, extensions: ['txt', 'doc', 'rtf', 'odt'] },
  { type: FILE_TYPE.image, extensions: ['jpg', 'jpeg', 'gif', 'png', 'tiff', 'raw'] },
  { type: FILE_TYPE.audio, extensions: ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'flac'] },
  { type: FILE_TYPE.video, extensions: ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg', 'mov', 'avi', 'mkv'] }
];

export const getFileType = url => {
  const sanitizedUrl = (url || '').trim();
  const extensionMatches = sanitizedUrl.match(/\.([0-9a-z]+)$/i);
  const extension = extensionMatches?.[1]?.toLowerCase();

  if (!extension) {
    return FILE_TYPE.none;
  }

  const extensionsGroup = extensionsGroups.find(group => group.extensions.includes(extension));

  return extensionsGroup?.type || FILE_TYPE.unknown;
};
