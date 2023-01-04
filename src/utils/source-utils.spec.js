import { describe, expect, it } from 'vitest';
import { SOURCE_TYPE } from '../domain/constants.js';
import { getSourceType, getPortableUrl, getAccessibleUrl, isInternalSourceType, couldAccessUrlFromRoom } from './source-utils.js';

describe('source-utils', () => {
  describe('getSourceType', () => {
    const cdnRootUrl = 'http://cdn-root/';
    const testCases = [
      { url: '', expectedResult: SOURCE_TYPE.none },
      { url: 'cdn://resource.jpeg', expectedResult: SOURCE_TYPE.unsupported },
      { url: 'cdn://media/resource.jpeg', expectedResult: SOURCE_TYPE.documentMedia },
      { url: 'cdn://rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: SOURCE_TYPE.roomMedia },
      { url: 'media/resource.jpeg', expectedResult: SOURCE_TYPE.documentMedia },
      { url: 'rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: SOURCE_TYPE.roomMedia },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: SOURCE_TYPE.unsupported },
      { url: 'http://cdn-root/media/resource.jpeg', expectedResult: SOURCE_TYPE.documentMedia },
      { url: 'http://cdn-root/rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: SOURCE_TYPE.roomMedia },
      { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/resource.jpg', expectedResult: SOURCE_TYPE.wikimediaCommons },
      { url: 'https://www.youtube.com/resource', expectedResult: SOURCE_TYPE.youtube },
      { url: 'https://youtu.be/resource', expectedResult: SOURCE_TYPE.youtube },
      { url: 'https://other.domain/resource.jpeg', expectedResult: SOURCE_TYPE.external },
      { url: 'http://other.domain/resource.jpeg', expectedResult: SOURCE_TYPE.unsupported },
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
      { url: 'cdn://media/resource.jpeg', expectedResult: true },
      { url: 'cdn://rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: true },
      { url: 'media/resource.jpeg', expectedResult: true },
      { url: 'rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: true },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: false },
      { url: 'http://cdn-root/media/resource.jpeg', expectedResult: true },
      { url: 'http://cdn-root/rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: true },
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
      { url: 'media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'cdn://media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'rooms/ch5zqo897tzo8f3/media/resource.jpeg', expectedResult: 'cdn://rooms/ch5zqo897tzo8f3/media/resource.jpeg' },
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
      { url: 'media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'http://cdn-root/media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'rooms/ch5zqo897tzo8f3/media/resource.jpeg', expectedResult: 'http://cdn-root/rooms/ch5zqo897tzo8f3/media/resource.jpeg' },
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
      { url: 'rooms/11111/media/resource.jpeg', targetRoomId: '22222', expectedResult: false },
      { url: 'cdn://rooms/11111/media/resource.jpeg', targetRoomId: '22222', expectedResult: false },
      { url: 'rooms/22222/media/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://rooms/22222/media/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'media/33333/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://media/33333/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'https://www.youtube.com/resource', targetRoomId: '22222', expectedResult: true },
      { url: 'cdn://other/22222/path/resource.jpeg', targetRoomId: '22222', expectedResult: true },
      { url: 'rooms/11111/media/resource.jpeg', targetRoomId: null, expectedResult: false },
      { url: 'cdn://rooms/11111/media/resource.jpeg', targetRoomId: null, expectedResult: false },
      { url: 'media/33333/resource.jpeg', targetRoomId: null, expectedResult: true }
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
