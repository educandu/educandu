import uniqueId from './unique-id.js';
import { createSandbox } from 'sinon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CDN_OBJECT_TYPE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import {
  getStorageLocationTypeForPath,
  getPathForPrivateRoom,
  getRoomIdFromPrivateStoragePath,
  componseUniqueFileName,
  composeHumanReadableDisplayName
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

  describe('composeHumanReadableDisplayName', () => {
    let t;

    describe('when the cdn object is a file', () => {
      beforeEach(() => {
        t = sandbox.fake();
        result = composeHumanReadableDisplayName({
          t,
          cdnObject: {
            type: CDN_OBJECT_TYPE.file,
            displayName: 'my-file.jpeg',
            documentMetadata: null
          }
        });
      });

      it('should return the file display name', () => {
        expect(result).toBe('my-file.jpeg');
      });
    });

    describe('when the cdn object is the public root path', () => {
      beforeEach(() => {
        t = sandbox.fake();
        result = composeHumanReadableDisplayName({
          t,
          cdnObject: {
            type: CDN_OBJECT_TYPE.directory,
            displayName: 'media',
            documentMetadata: null
          }
        });
      });

      it('should return the file display name', () => {
        expect(result).toBe('media');
      });
    });

    describe('when the cdn object does not contain document metadata', () => {
      beforeEach(() => {
        t = sandbox.stub();
        t.withArgs('common:unknownDocument').returns('Unknown document');
        result = composeHumanReadableDisplayName({
          t,
          cdnObject: {
            type: CDN_OBJECT_TYPE.directory,
            displayName: 'ch5zqo897tzo8f3',
            documentMetadata: null
          }
        });
      });

      it('should return the composed display name', () => {
        expect(result).toBe('Unknown document [ch5zqo897tzo8f3]');
      });
    });

    describe('when the cdn object corresponds to a document accessible to the current user', () => {
      beforeEach(() => {
        t = sandbox.stub();
        t.withArgs('common:unknownDocument').returns('Unknown document');
        result = composeHumanReadableDisplayName({
          t,
          cdnObject: {
            type: CDN_OBJECT_TYPE.directory,
            displayName: 'ch5zqo897tzo8f3',
            documentMetadata: { title: 'Document title', isAccessibleToUser: true }
          }
        });
      });

      it('should return the composed display name', () => {
        expect(result).toBe('Document title [ch5zqo897tzo8f3]');
      });
    });

    describe('when the cdn object corresponds to a document that is not accessible to the current user', () => {
      beforeEach(() => {
        t = sandbox.stub();
        t.withArgs('common:privateDocument').returns('Private document');
        result = composeHumanReadableDisplayName({
          t,
          cdnObject: {
            type: CDN_OBJECT_TYPE.directory,
            displayName: 'ch5zqo897tzo8f3',
            documentMetadata: { title: 'Document title', isAccessibleToUser: false }
          }
        });
      });

      it('should return the composed display name', () => {
        expect(result).toBe('Private document [ch5zqo897tzo8f3]');
      });
    });
  });
});
