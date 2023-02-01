import { describe, expect, it } from 'vitest';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getStorageLocationTypeForPath, getRoomMediaRoomPath, tryGetRoomIdFromStoragePath, createUniqueStorageFileName } from './storage-utils.js';

describe('storage-utils', () => {
  describe('getStorageLocationTypeForPath', () => {
    const testCases = [
      { path: 'root/media/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'mediatech/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'media/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.documentMedia },
      { path: '/root/rooms/media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: '/media/rooms/media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: '/root/rooms/roomId/media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'rooms/roomId/media/', expectedResult: STORAGE_LOCATION_TYPE.roomMedia }
    ];

    testCases.forEach(({ path, expectedResult }) => {
      it(`should return '${expectedResult}' for '${path}'`, () => {
        const actualResult = getStorageLocationTypeForPath(path);
        expect(actualResult).toBe(expectedResult);
      });
    });
  });

  describe('getRoomMediaRoomPath', () => {
    it('should return the path', () => {
      expect(getRoomMediaRoomPath('myRoom')).toBe('rooms/myRoom/media');
    });
  });

  describe('tryGetRoomIdFromStoragePath', () => {
    it('should return the room id when the path is valid', () => {
      expect(tryGetRoomIdFromStoragePath('rooms/myRoom/media/')).toBe('myRoom');
    });

    it('should return null when the path is invalid', () => {
      expect(tryGetRoomIdFromStoragePath('root/rooms/myRoom/media/')).toBe(null);
    });
  });

  describe('createUniqueStorageFileName', () => {
    const generateId = () => 'ch5zQo897tzo8f3';
    const testCases = [
      { fileName: 'hello-world-123.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'hello-world-123.MP3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'hello_world_123.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'hello world 123.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'héllö wøȑlð 123.mp3', expectedResult: 'helloe-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'Hällo Wörld 123.mp3', expectedResult: 'haello-woerld-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', expectedResult: 'hello-world-123-ch5zQo897tzo8f3.mp3' },
      { fileName: '### ###.mp3', expectedResult: 'ch5zQo897tzo8f3.mp3' }
    ];

    testCases.forEach(({ fileName, expectedResult }) => {
      it(`should transform fileName '${fileName} to '${expectedResult}'`, () => {
        const actualResult = createUniqueStorageFileName(fileName, generateId);
        expect(actualResult).toBe(expectedResult);
      });
    });
  });
});
