const privateCdnPathPattern = /^rooms\/([^/]+)\/media\//;

export const STORAGE_PATH_TYPE = {
  unknown: 'unknown',
  public: 'public',
  private: 'private'
};

export function getStoragePathType(path) {
  if (path.startsWith('media/')) {
    return STORAGE_PATH_TYPE.public;
  }
  const match = path.match(privateCdnPathPattern);
  if (match) {
    return STORAGE_PATH_TYPE.private;
  }
  return STORAGE_PATH_TYPE.unknown;
}

export function getPrivateStoragePathForRoomId(roomId) {
  return `rooms/${roomId}/media/`;
}

export function getRoomIdFromPrivateStoragePath(path) {
  const match = path.match(privateCdnPathPattern);
  return match ? match[1] : null;
}

export function isAccessibleStoragePath(storagePath, fromRoomId) {
  return storagePath && getStoragePathType(storagePath) === STORAGE_PATH_TYPE.private
    ? getRoomIdFromPrivateStoragePath(storagePath) === fromRoomId
    : true;
}

export function getPathSegments(path) {
  return path.split('/').filter(seg => !!seg);
}

export function getPrefix(segments) {
  return segments.filter(s => !!s).map(s => `${s}/`).join('');
}

export function isSubPath({ pathSegments, subPathSegments }) {
  return pathSegments.length <= subPathSegments.length
    && pathSegments.every((part, index) => part === subPathSegments[index]);
}

export function getPrefixFromStoragePath(path) {
  const segments = getPathSegments(path);
  return getPrefix(segments.slice(0, -1));
}
