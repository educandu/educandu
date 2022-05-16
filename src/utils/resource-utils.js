import { FileImageOutlined, FileOutlined, FilePdfOutlined, FileTextOutlined, FolderOutlined } from '@ant-design/icons';
import { RESOURCE_TYPE } from '../domain/constants.js';

const extensionsGroups = [
  { type: RESOURCE_TYPE.pdf, extensions: ['pdf'] },
  { type: RESOURCE_TYPE.text, extensions: ['txt', 'doc', 'rtf', 'odt'] },
  { type: RESOURCE_TYPE.audio, extensions: ['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'flac'] },
  { type: RESOURCE_TYPE.image, extensions: ['jpg', 'jpeg', 'gif', 'png', 'tiff', 'raw', 'webp'] },
  { type: RESOURCE_TYPE.video, extensions: ['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg', 'mov', 'avi', 'mkv'] }
];

export const getResourceType = url => {
  const sanitizedUrl = (url || '').trim();
  const extensionMatches = sanitizedUrl.match(/\.([0-9a-z]+)$/i);
  const extension = extensionMatches?.[1]?.toLowerCase();

  if (!extension) {
    return RESOURCE_TYPE.none;
  }

  const extensionsGroup = extensionsGroups.find(group => group.extensions.includes(extension));

  return extensionsGroup?.type || RESOURCE_TYPE.unknown;
};

export const getResourceIcon = ({ filePath, isDirectory }) => {
  if (isDirectory) {
    return FolderOutlined;
  }

  const resourceType = getResourceType(filePath);

  switch (resourceType) {
    case RESOURCE_TYPE.image:
      return FileImageOutlined;
    case RESOURCE_TYPE.pdf:
      return FilePdfOutlined;
    case RESOURCE_TYPE.text:
      return FileTextOutlined;
    default:
      return FileOutlined;
  }
};
