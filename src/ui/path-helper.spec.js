import {
  isSubPath,
  getPrefix,
  getPathSegments,
  STORAGE_PATH_TYPE,
  getStoragePathType,
  getPrivateStoragePathForRoomId,
  getRoomIdFromPrivateStoragePath
} from './path-helper.js';

describe('path-helper', () => {
  let result;

  describe('getStoragePathType', () => {
    const testCases = [
      { path: 'root/media/resourceId', expectedResult: STORAGE_PATH_TYPE.unknown },
      { path: 'mediatech/resourceId', expectedResult: STORAGE_PATH_TYPE.unknown },
      { path: 'media/resourceId', expectedResult: STORAGE_PATH_TYPE.public },
      { path: '/root/rooms/media', expectedResult: STORAGE_PATH_TYPE.unknown },
      { path: '/media/rooms/media', expectedResult: STORAGE_PATH_TYPE.unknown },
      { path: '/root/rooms/roomId/media', expectedResult: STORAGE_PATH_TYPE.unknown },
      { path: 'rooms/roomId/media', expectedResult: STORAGE_PATH_TYPE.private }
    ];

    testCases.forEach(({ path, expectedResult }) => {
      describe(`when called with '${path}'`, () => {
        beforeEach(() => {
          result = getStoragePathType(path);
        });

        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('getPrivateStoragePathForRoomId', () => {
    it('should return the path', () => {
      expect(getPrivateStoragePathForRoomId('myRoom')).toBe('rooms/myRoom/media/');
    });
  });

  describe('getRoomIdFromPrivateStoragePath', () => {
    it('should return the room id when the path is valid', () => {
      expect(getRoomIdFromPrivateStoragePath('rooms/myRoom/media/')).toBe('myRoom');
    });

    it('should return null when the path is invalid', () => {
      expect(getRoomIdFromPrivateStoragePath('root/rooms/myRoom/media/')).toBe(null);
    });
  });

  describe('getPathSegments', () => {
    it('should return an array of all non-empty path sements', () => {
      expect(getPathSegments('my////path/')).toEqual(['my', 'path']);
    });
  });

  describe('getPrefix', () => {
    it('should return the composed prefix (storage path)', () => {
      expect(getPrefix(['my', '', '', 'path', null])).toEqual('my/path/');
    });
  });

  describe('isSubPath', () => {
    it('should return true when the segments are in the path', () => {
      expect(isSubPath({ pathSegments: ['rooms', 'roomId', 'media'], subPathSegments: ['rooms', 'roomId', 'media', 'fileName'] })).toBe(true);
    });

    it('should return false when the segments are not in the path', () => {
      expect(isSubPath({ pathSegments: ['roomId'], subPathSegments: ['rooms', 'roomId'] })).toBe(false);
    });
  });
});
