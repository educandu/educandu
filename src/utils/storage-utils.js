import uniqueId from './unique-id.js';
import urlUtils from './url-utils.js';
import slugify from '@sindresorhus/slugify';
import {
  STORAGE_LOCATION_TYPE,
  IMAGE_OPTIMIZATION_QUALITY,
  ROOM_MEDIA_STORAGE_PATH_PATTERN,
  IMAGE_OPTIMIZATION_THRESHOLD_WIDTH,
  IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES,
  IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES,
  MEDIA_LIBRRY_STORAGE_PATH_PATTERN
} from '../domain/constants.js';

const rasterImageFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

export function getMediaLibraryPath() {
  return 'media-library';
}

export function getRoomMediaRoomPath(roomId) {
  return `room-media/${roomId}`;
}

export function getDocumentInputMediaPath(roomId, documentInputId) {
  return `document-input-media/${roomId}/${documentInputId}`;
}

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

export function processFileBeforeUpload({ file, optimizeImages }) {
  return rasterImageFileTypes.includes(file.type)
    ? convertImageToBlob({ file, optimize: optimizeImages })
    : file;
}

export function processFilesBeforeUpload({ files, optimizeImages }) {
  return Promise.all(files.map(file => processFileBeforeUpload({ file, optimizeImages })));
}

export function getStorageLocationTypeForPath(path) {
  if (MEDIA_LIBRRY_STORAGE_PATH_PATTERN.test(path)) {
    return STORAGE_LOCATION_TYPE.mediaLibrary;
  }
  if (ROOM_MEDIA_STORAGE_PATH_PATTERN.test(path)) {
    return STORAGE_LOCATION_TYPE.roomMedia;
  }
  return STORAGE_LOCATION_TYPE.unknown;
}

export function tryGetRoomIdFromStoragePath(path) {
  const match = path.match(ROOM_MEDIA_STORAGE_PATH_PATTERN);
  return match ? match[1] : null;
}

export function createUniqueStorageFileName(fileName, generateId = uniqueId.create) {
  const { baseName, extension } = urlUtils.splitAtExtension(fileName);
  const basenameWithId = [slugify(baseName), generateId()].filter(x => x).join('-');
  return `${basenameWithId}${extension.toLowerCase()}`;
}

export async function getPrivateStorageOverview({ user, roomStore, storagePlanStore, roomMediaItemStore, documentInputMediaItemStore }) {
  const storagePlan = user.storage.planId
    ? await storagePlanStore.getStoragePlanById(user.storage.planId)
    : null;

  const rooms = await roomStore.getRoomsByOwnerUserId(user._id);
  const mediaItemsPerRoom = await Promise.all(rooms.map(async room => {
    const roomMediaItems = await roomMediaItemStore.getAllRoomMediaItemsByRoomId(room._id);
    const documentInputMediaItems = await documentInputMediaItemStore.getAllDocumentInputMediaItemByRoomId(room._id);

    const usedBytesByRoomMediaItems = roomMediaItems.reduce((accu, item) => accu + item.size, 0);
    const usedBytesByDocumentInputMediaItems = documentInputMediaItems.reduce((accu, item) => accu + item.size, 0);
    return {
      room,
      roomMediaItems,
      documentInputMediaItems,
      usedBytesByRoomMediaItems,
      usedBytesByDocumentInputMediaItems,
      totalUsedBytes: usedBytesByRoomMediaItems + usedBytesByDocumentInputMediaItems
    };
  }));

  const usedBytesInAllRooms = mediaItemsPerRoom.reduce((accu, { totalUsedBytes }) => accu + totalUsedBytes, 0);

  return {
    storagePlan: storagePlan || null,
    usedBytes: usedBytesInAllRooms,
    roomStorageList: mediaItemsPerRoom.map(({ room, roomMediaItems }) => ({
      roomId: room._id,
      roomName: room.name,
      roomMediaItems
    }))
  };
}
