import { SOURCE_TYPE } from '../domain/constants.js';
import { getSourceType, getPortableUrl, getAccessibleUrl } from './source-utils.js';

describe('source-utils', () => {
  describe('getSourceType', () => {
    const cdnRootUrl = 'http://cdn-root/';
    const testCases = [
      { url: '', expectedResult: SOURCE_TYPE.none },
      { url: 'cdn://resource.jpeg', expectedResult: SOURCE_TYPE.unsupported },
      { url: 'cdn://media/resource.jpeg', expectedResult: SOURCE_TYPE.internalPublic },
      { url: 'cdn://rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: SOURCE_TYPE.internalPrivate },
      { url: 'media/resource.jpeg', expectedResult: SOURCE_TYPE.internalPublic },
      { url: 'rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: SOURCE_TYPE.internalPrivate },
      { url: 'http://cdn-root/resource.jpeg', expectedResult: SOURCE_TYPE.unsupported },
      { url: 'http://cdn-root/media/resource.jpeg', expectedResult: SOURCE_TYPE.internalPublic },
      { url: 'http://cdn-root/rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: SOURCE_TYPE.internalPrivate },
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
});
