import { describe, expect, it } from 'vitest';
import { SOURCE_TYPE } from '../domain/constants.js';
import { getSourceType, getPortableUrl, getAccessibleUrl, isInternalSourceType, couldAccessUrlFromRoom } from './source-utils.js';

describe('source-utils', () => {
  describe('getSourceType', () => {
    const cdnRootUrl = 'http://cdn-root/';
    const testCases = [
      { url: '', expectedResult: SOURCE_TYPE.none },
      { url: 'cdn://resource.jpeg', expectedResult: SOURCE_TYPE.external },
      { url: 'cdn://document-media/resource.jpeg', expectedResult: SOURCE_TYPE.documentMedia },
      { url: 'cdn://room-media/vQHrRHX4X3HSj49Eq4dqyGresource.jpeg', expectedResult: SOURCE_TYPE.roomMedia },
      { url: 'document-media/resource.jpeg', expectedResult: SOURCE_TYPE.documentMedia },
      { url: 'room-media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: SOURCE_TYPE.roomMedia },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: SOURCE_TYPE.external },
      { url: 'http://cdn-root/document-media/resource.jpeg', expectedResult: SOURCE_TYPE.documentMedia },
      { url: 'http://cdn-root/room-media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: SOURCE_TYPE.roomMedia },
      { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/resource.jpg', expectedResult: SOURCE_TYPE.wikimedia },
      { url: 'https://www.youtube.com/resource', expectedResult: SOURCE_TYPE.youtube },
      { url: 'https://youtu.be/resource', expectedResult: SOURCE_TYPE.youtube },
      { url: 'https://other.domain/resource.jpeg', expectedResult: SOURCE_TYPE.external },
      { url: 'http://other.domain/resource.jpeg', expectedResult: SOURCE_TYPE.external },
      { url: 'other.domain/resource.jpeg', expectedResult: SOURCE_TYPE.unsupported }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when called with url = ${url}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(getSourceType({ url, cdnRootUrl })).toBe(expectedResult);
        });
      });
    });
  });

  describe('isInternalSourceType', () => {
    const cdnRootUrl = 'http://cdn-root/';
    const testCases = [
      { url: '', expectedResult: false },
      { url: 'cdn://resource.jpeg', expectedResult: false },
      { url: 'cdn://media-library/resource.jpeg', expectedResult: true },
      { url: 'cdn://document-media/resource.jpeg', expectedResult: true },
      { url: 'cdn://room-media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: true },
      { url: 'media-library/resource.jpeg', expectedResult: true },
      { url: 'document-media/resource.jpeg', expectedResult: true },
      { url: 'room-media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: true },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: false },
      { url: 'http://cdn-root/media-library/resource.jpeg', expectedResult: true },
      { url: 'http://cdn-root/document-media/resource.jpeg', expectedResult: true },
      { url: 'http://cdn-root/room-media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: true },
      { url: 'https://www.youtube.com/resource', expectedResult: false },
      { url: 'https://youtu.be/resource', expectedResult: false },
      { url: 'https://other.domain/resource.jpeg', expectedResult: false },
      { url: 'http://other.domain/resource.jpeg', expectedResult: false },
      { url: 'other.domain/resource.jpeg', expectedResult: false }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when called with url = ${url}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(isInternalSourceType({ url, cdnRootUrl })).toBe(expectedResult);
        });
      });
    });
  });

  describe('getPortableUrl', () => {
    const cdnRootUrl = 'http://cdn-root';
    const testCases = [
      { url: '', expectedResult: '' },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: 'cdn://resource.jpeg' },
      { url: 'cdn://resource.jpeg', expectedResult: 'cdn://resource.jpeg' },
      { url: 'media-library/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'cdn://media-library/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'document-media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'cdn://document-media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'room-media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'cdn://room-media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'http://other-domain/resource.jpeg', expectedResult: 'http://other-domain/resource.jpeg' }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when url = '${url}' and cdnRoutUrl = '${cdnRootUrl}'`, () => {
        it(`should return ${expectedResult}`, () => {
          expect(getPortableUrl({ url, cdnRootUrl })).toBe(expectedResult);
        });
      });
    });
  });

  describe('getAccessibleUrl', () => {
    const cdnRootUrl = 'http://cdn-root';

    const testCases = [
      { url: '', expectedResult: '' },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: 'http://cdn-root/resource.jpeg' },
      { url: 'cdn://resource.jpeg', expectedResult: 'http://cdn-root/resource.jpeg' },
      { url: 'media-library/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'http://cdn-root/media-library/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'document-media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'http://cdn-root/document-media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'room-media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'http://cdn-root/room-media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'http://other-domain/resource.jpeg', expectedResult: 'http://other-domain/resource.jpeg' }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when url = '${url}' and cdnRoutUrl = '${cdnRootUrl}'`, () => {
        it(`should return ${expectedResult}`, () => {
          expect(getAccessibleUrl({ url, cdnRootUrl })).toBe(expectedResult);
        });
      });
    });
  });

  describe('couldAccessUrlFromRoom', () => {
    const testCases = [
      { url: '', targetRoomId: null, expectedResult: true },
      { url: 'room-media/11111/resource.jpeg', targetRoomId: '22222', expectedResult: false },
      { url: 'cdn://room-media/11111/resource.jpeg', targetRoomId: '22222', expectedResult: false },
      { url: 'room-media/22222/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://room-media/22222/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'media-library/33333/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://media-library/33333/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'document-media/33333/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://document-media/33333/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'https://www.youtube.com/resource', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://other/22222/path/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'room-media/11111/resource.jpeg', targetRoomId: null, expectedResult: false },
      { url: 'cdn://room-media/11111/resource.jpeg', targetRoomId: null, expectedResult: false },
      { url: 'media-library/33333/resource.jpeg', targetRoomId: null, expectedResult: true },
      { url: 'document-media/33333/resource.jpeg', targetRoomId: null, expectedResult: true }
    ];

    testCases.forEach(({ url, targetRoomId, expectedResult }) => {
      describe(`when called with url = ${url} and targetRoomId = '${targetRoomId}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(couldAccessUrlFromRoom(url, targetRoomId)).toBe(expectedResult);
        });
      });
    });
  });
});
