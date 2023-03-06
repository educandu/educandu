import urlUtils from './url-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import FilePdfIcon from '../components/icons/files/file-pdf-icon.js';
import FileImageIcon from '../components/icons/files/file-image-icon.js';
import FileAudioIcon from '../components/icons/files/file-audio-icon.js';
import FileVideoIcon from '../components/icons/files/file-video-icon.js';
import FileUnknownIcon from '../components/icons/files/file-unknown-icon.js';
import FilePdfFilledIcon from '../components/icons/files/file-pdf-filled-icon.js';
import FileImageFilledIcon from '../components/icons/files/file-image-filled-icon.js';
import FileAudioFilledIcon from '../components/icons/files/file-audio-filled-icon.js';
import FileVideoFilledIcon from '../components/icons/files/file-video-filled-icon.js';
import FileUnknownFilledIcon from '../components/icons/files/file-unknown-filled-icon.js';

const resorceTypeByExtension = {
  '.jpg': RESOURCE_TYPE.image,
  '.jpeg': RESOURCE_TYPE.image,
  '.gif': RESOURCE_TYPE.image,
  '.png': RESOURCE_TYPE.image,
  '.tiff': RESOURCE_TYPE.image,
  '.raw': RESOURCE_TYPE.image,
  '.webp': RESOURCE_TYPE.image,
  '.svg': RESOURCE_TYPE.image,
  '.aac': RESOURCE_TYPE.audio,
  '.m4a': RESOURCE_TYPE.audio,
  '.mp3': RESOURCE_TYPE.audio,
  '.oga': RESOURCE_TYPE.audio,
  '.ogg': RESOURCE_TYPE.audio,
  '.wav': RESOURCE_TYPE.audio,
  '.flac': RESOURCE_TYPE.audio,
  '.mp4': RESOURCE_TYPE.video,
  '.m4v': RESOURCE_TYPE.video,
  '.ogv': RESOURCE_TYPE.video,
  '.webm': RESOURCE_TYPE.video,
  '.mpg': RESOURCE_TYPE.video,
  '.mpeg': RESOURCE_TYPE.video,
  '.mov': RESOURCE_TYPE.video,
  '.avi': RESOURCE_TYPE.video,
  '.mkv': RESOURCE_TYPE.video,
  '.pdf': RESOURCE_TYPE.pdf
};

export const getResourceType = url => {
  const { extension } = urlUtils.splitAtExtension(url);
  const lowercasedExtension = extension.toLowerCase();
  return extension
    ? resorceTypeByExtension[lowercasedExtension] || RESOURCE_TYPE.unknown
    : RESOURCE_TYPE.none;
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
    default:
      return filled ? FileUnknownFilledIcon : FileUnknownIcon;
  }
};

export const getResourceTypeTranslation = ({ resourceType, t }) => {
  return t(`common:resourceType_${resourceType}`);
};
