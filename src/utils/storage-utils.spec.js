import uniqueId from './unique-id.js';
import { createSandbox } from 'sinon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import {
  getStorageLocationTypeForPath,
  getRoomMediaRoomPath,
  tryGetRoomIdFromStoragePath,
  componseUniqueFileName
} from './storage-utils.js';

describe('storage-utils', () => {
  let result;

  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.stub(uniqueId, 'create').returns('ch5zqo897tzo8f3');
  });

  afterEach(() => {
    sandbox.restore();
  });

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
      describe(`when called with '${path}'`, () => {
        beforeEach(() => {
          result = getStorageLocationTypeForPath(path);
        });

        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
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

  describe('componseUniqueFileName', () => {
    const testCases = [
      { fileName: 'hello-world-123.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'hello_world_123.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'hello world 123.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'héllö wøȑlð 123.mp3', prefix: null, expectedOutput: 'helloe-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'Hällo Wörld 123.mp3', prefix: null, expectedOutput: 'haello-woerld-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', prefix: 'media/my-directory/', expectedOutput: 'media/my-directory/hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: '### ###.mp3', prefix: 'media/my-directory/', expectedOutput: 'media/my-directory/ch5zqo897tzo8f3.mp3' }
    ];

    testCases.forEach(({ fileName, prefix, expectedOutput }) => {
      it(`should transform fileName '${fileName} with prefix ${prefix === null ? 'null' : `'${prefix}'`} to '${expectedOutput}'`, () => {
        const actualOutput = componseUniqueFileName(fileName, prefix);
        expect(actualOutput).toBe(expectedOutput);
      });
    });
  });
});
