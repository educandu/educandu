import { SOURCE_TYPE } from '../domain/constants.js';
import { getSourceType, getPortableUrl, getAccessibleUrl, isInternalSourceType, getPersistableUrl } from './source-utils.js';

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

  describe('getPersistableUrl', () => {
    const cdnRootUrl = 'http://cdn-root';
    const testCases = [
      { url: '', expectedResult: '' },
      { url: 'http://cdn-root/media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: 'media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg' },
      { url: 'http://cdn-root/rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: 'rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg' },
      { url: 'cdn://media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg', expectedResult: 'media/vQHrRHX4X3HSj49Eq4dqyG/resource.jpeg' },
      { url: 'cdn://rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg', expectedResult: 'rooms/vQHrRHX4X3HSj49Eq4dqyG/media/resource.jpeg' },
      { url: 'media/ch5zqo897tzo8f3/resource.jpeg', expectedResult: 'media/ch5zqo897tzo8f3/resource.jpeg' },
      { url: 'rooms/ch5zqo897tzo8f3/media/resource.jpeg', expectedResult: 'rooms/ch5zqo897tzo8f3/media/resource.jpeg' },
      { url: 'http://other-domain/resource.jpeg', expectedResult: 'http://other-domain/resource.jpeg' }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when url = '${url}' and cdnRoutUrl = '${cdnRootUrl}'`, () => {
        it(`should return ${expectedResult}`, () => {
          expect(getPersistableUrl({ url, cdnRootUrl })).toBe(expectedResult);
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
