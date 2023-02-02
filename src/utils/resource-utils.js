import urlUtils from './url-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import FilePdfIcon from '../components/icons/files/file-pdf-icon.js';
import FileTextIcon from '../components/icons/files/file-text-icon.js';
import FileImageIcon from '../components/icons/files/file-image-icon.js';
import FileAudioIcon from '../components/icons/files/file-audio-icon.js';
import FileVideoIcon from '../components/icons/files/file-video-icon.js';
import FileUnknownIcon from '../components/icons/files/file-unknown-icon.js';
import FilePdfFilledIcon from '../components/icons/files/file-pdf-filled-icon.js';
import FileTextFilledIcon from '../components/icons/files/file-text-filled-icon.js';
import FileImageFilledIcon from '../components/icons/files/file-image-filled-icon.js';
import FileAudioFilledIcon from '../components/icons/files/file-audio-filled-icon.js';
import FileVideoFilledIcon from '../components/icons/files/file-video-filled-icon.js';
import FileUnknownFilledIcon from '../components/icons/files/file-unknown-filled-icon.js';

const extensionsGroups = [
  { type: RESOURCE_TYPE.pdf, extensions: ['pdf'] },
  { type: RESOURCE_TYPE.text, extensions: ['txt'] },
  { type: RESOURCE_TYPE.audio, extensions: ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'flac'] },
  { type: RESOURCE_TYPE.image, extensions: ['jpg', 'jpeg', 'gif', 'png', 'tiff', 'raw', 'webp', 'svg'] },
  { type: RESOURCE_TYPE.video, extensions: ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg', 'mov', 'avi', 'mkv'] }
];

export const getResourceFullName = url => {
  const sanitizedUrl = (url || '').trim();
  return sanitizedUrl.split('/').pop();
};

export const getResourceType = url => {
  const { rawExtension } = urlUtils.splitAtExtension(url);

  if (!rawExtension) {
    return RESOURCE_TYPE.none;
  }

  const lowercasedExtension = rawExtension.toLowerCase();
  const extensionsGroup = extensionsGroups.find(group => group.extensions.includes(lowercasedExtension));

  return extensionsGroup?.type || RESOURCE_TYPE.unknown;
};

export const getResourceIcon = ({ url, filled }) => {
  const resourceType = getResourceType(url);

  switch (resourceType) {
    case RESOURCE_TYPE.image:
      return filled ? FileImageFilledIcon : FileImageIcon;
    case RESOURCE_TYPE.audio:
      return filled ? FileAudioFilledIcon : FileAudioIcon;
    case RESOURCE_TYPE.video:
      return filled ? FileVideoFilledIcon : FileVideoIcon;
    case RESOURCE_TYPE.pdf:
      return filled ? FilePdfFilledIcon : FilePdfIcon;
    case RESOURCE_TYPE.text:
      return filled ? FileTextFilledIcon : FileTextIcon;
    default:
      return filled ? FileUnknownFilledIcon : FileUnknownIcon;
  }
};
