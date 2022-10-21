import uniqueId from './unique-id.js';
import urlUtils from './url-utils.js';
import slugify from '@sindresorhus/slugify';
import { getResourceExtension } from './resource-utils.js';
import {
  CDN_OBJECT_TYPE,
  STORAGE_LOCATION_TYPE,
  IMAGE_OPTIMIZATION_QUALITY,
  IMAGE_OPTIMIZATION_THRESHOLD_WIDTH,
  IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES,
  IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES,
  INTERNAL_PUBLIC_STORAGE_PATH_PATTERN,
  INTERNAL_PRIVATE_STORAGE_PATH_PATTERN
} from '../domain/constants.js';

const rasterImageFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

const getScaledDownDimensions = img => {
  if (img.naturalWidth <= IMAGE_OPTIMIZATION_THRESHOLD_WIDTH) {
    return { width: img.naturalWidth, height: img.naturalHeight };
  }

  const ratio = img.naturalWidth / IMAGE_OPTIMIZATION_THRESHOLD_WIDTH;
  return { width: IMAGE_OPTIMIZATION_THRESHOLD_WIDTH, height: Math.round(((img.naturalHeight / ratio) + Number.EPSILON) * 100) / 100 };
};

const imageCanBeOptimized = ({ naturalSize, naturalWidth }) => {
  const widthIsTooBig = naturalWidth > IMAGE_OPTIMIZATION_THRESHOLD_WIDTH && naturalSize > IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES;
  const sizeIsTooBig = naturalSize > IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES;

  return widthIsTooBig || sizeIsTooBig;
};

const convertImageToBlob = ({ file, optimize }) => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        if (!optimize || !imageCanBeOptimized({ naturalSize: file.size, naturalWidth: img.naturalWidth })) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        const size = getScaledDownDimensions(img);
        canvas.width = size.width;
        canvas.height = size.height;
        context.drawImage(img, 0, 0, size.width, size.height);

        canvas.toBlob(blob => {
          const processedFile = new File([blob], file.name);
          resolve(processedFile);
        }, file.type, IMAGE_OPTIMIZATION_QUALITY);
      };
    };
  });
};

export function isEditableImageFile(file) {
  return rasterImageFileTypes.includes(file.type);
}

export function processFilesBeforeUpload({ files, optimizeImages }) {
  return Promise.all(files.map(file => {
    return rasterImageFileTypes.includes(file.type)
      ? convertImageToBlob({ file, optimize: optimizeImages })
      : file;
  }));
}

export function getStorageLocationTypeForPath(path) {
  if (INTERNAL_PUBLIC_STORAGE_PATH_PATTERN.test(path)) {
    return STORAGE_LOCATION_TYPE.public;
  }
  if (INTERNAL_PRIVATE_STORAGE_PATH_PATTERN.test(path)) {
    return STORAGE_LOCATION_TYPE.private;
  }
  return STORAGE_LOCATION_TYPE.unknown;
}

export function canUploadToPath(path) {
  if (!path) {
    return false;
  }

  const publicPathMatch = path.match(INTERNAL_PUBLIC_STORAGE_PATH_PATTERN);
  const privatePathMatch = path.match(INTERNAL_PRIVATE_STORAGE_PATH_PATTERN);

  const documentId = publicPathMatch?.[1];
  const roomId = privatePathMatch?.[1];

  return !!(documentId || roomId);
}

export function getStorageLocationPathForUrl(url) {
  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'cdn:') {
      return null;
    }
    return urlUtils.removeLeadingSlashes(urlObj.pathname);
  } catch {
    return null;
  }
}

export function getParentPathForStorageLocationPath(pathname) {
  return (pathname || '').split('/').slice(0, -1).join('/');
}

export function getStorageLocationTypeForUrl(url) {
  const storageLocationPath = getStorageLocationPathForUrl(url);
  return storageLocationPath ? getStorageLocationTypeForPath(storageLocationPath) : STORAGE_LOCATION_TYPE.unknown;
}

export function getPublicRootPath() {
  return 'media';
}

export function getPrivateRoomsRootPath() {
  return 'rooms';
}

export function getPublicHomePath(documentId) {
  return `media/${documentId}`;
}

export function getPathForPrivateRoom(roomId) {
  return `rooms/${roomId}/media`;
}

export function getRoomIdFromPrivateStoragePath(path) {
  const match = path.match(INTERNAL_PRIVATE_STORAGE_PATH_PATTERN);
  return match ? match[1] : null;
}

export function componseUniqueFileName(fileName, parentPath = null) {
  const id = uniqueId.create();
  const extension = getResourceExtension(fileName);
  const baseName = fileName.substr(0, fileName.length - extension.length);
  const slugifiedBaseName = slugify(baseName);
  const uniqueBaseName = [slugifiedBaseName, id].filter(x => x).join('-');
  const newFileName = `${uniqueBaseName}.${extension}`;
  return parentPath ? urlUtils.concatParts(parentPath, newFileName) : newFileName;
}

export function composeHumanReadableDisplayName({ cdnObject, t }) {
  if (cdnObject.type === CDN_OBJECT_TYPE.file || cdnObject.displayName === getPublicRootPath()) {
    return cdnObject.displayName;
  }

  if (!cdnObject.documentMetadata) {
    return `${t('common:unknownDocument')} [${cdnObject.displayName}]`;
  }

  return cdnObject.documentMetadata.isAccessibleToUser
    ? `${cdnObject.documentMetadata.title} [${cdnObject.displayName}]`
    : `${t('common:privateDocument')} [${cdnObject.displayName}]`;
}
