import sinon from 'sinon';
import uniqueId from './unique-id.js';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import {
  isAccessibleStoragePath,
  getStorageLocationTypeForPath,
  getPathForPrivateRoom,
  getRoomIdFromPrivateStoragePath,
  componseUniqueFileName
} from './storage-utils.js';

describe('storage-utils', () => {
  let result;

  const sandbox = sinon.createSandbox();

  beforeAll(() => {
    sandbox.stub(uniqueId, 'create').returns('ch5zqo897tzo8f3');
  });

  describe('getStorageLocationTypeForPath', () => {
    const testCases = [
      { path: 'root/media/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'mediatech/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'media/resourceId/', expectedResult: STORAGE_LOCATION_TYPE.public },
      { path: '/root/rooms/media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: '/media/rooms/media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: '/root/rooms/roomId/media/', expectedResult: STORAGE_LOCATION_TYPE.unknown },
      { path: 'rooms/roomId/media/', expectedResult: STORAGE_LOCATION_TYPE.private }
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

  describe('isAccessibleStoragePath', () => {
    const testCases = [
      { path: null, roomId: '12345', expectedResult: true },
      { path: 'media/12345/my-file.png', roomId: null, expectedResult: true },
      { path: 'media/12345/my-file.png', roomId: '12345', expectedResult: true },
      { path: 'media/67890/my-file.png', roomId: '12345', expectedResult: true },
      { path: null, roomId: '12345', expectedResult: true },
      { path: 'rooms/12345/media/my-file.png', roomId: null, expectedResult: false },
      { path: 'rooms/12345/media/my-file.png', roomId: '12345', expectedResult: true },
      { path: 'rooms/67890/media/my-file.png', roomId: '12345', expectedResult: false }
    ];

    testCases.forEach(({ path, roomId, expectedResult }) => {
      describe(`when called with path ${JSON.stringify(path)} and room ID ${JSON.stringify(roomId)}`, () => {
        beforeEach(() => {
          result = isAccessibleStoragePath(path, roomId);
        });

        it(`should return ${expectedResult}`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('getPathForPrivateRoom', () => {
    it('should return the path', () => {
      expect(getPathForPrivateRoom('myRoom')).toBe('rooms/myRoom/media');
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

  describe('componseUniqueFileName', () => {
    const testCases = [
      { fileName: 'hello-world-123.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'hello_world_123.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'hello world 123.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'héllö wøȑlð 123.mp3', prefix: null, expectedOutput: 'helloe-wo-ld-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'Hällo Wörld 123.mp3', prefix: null, expectedOutput: 'haello-woerld-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', prefix: null, expectedOutput: 'hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: 'Hello World 123 !"§.mp3', prefix: 'media/my-folder/', expectedOutput: 'media/my-folder/hello-world-123-ch5zqo897tzo8f3.mp3' },
      { fileName: '### ###.mp3', prefix: 'media/my-folder/', expectedOutput: 'media/my-folder/ch5zqo897tzo8f3.mp3' }
    ];

    testCases.forEach(({ fileName, prefix, expectedOutput }) => {
      it(`should transform fileName '${fileName} with prefix ${prefix === null ? 'null' : `'${prefix}'`} to '${expectedOutput}'`, () => {
        const actualOutput = componseUniqueFileName(fileName, prefix);
        expect(actualOutput).toBe(expectedOutput);
      });
    });
  });
});
