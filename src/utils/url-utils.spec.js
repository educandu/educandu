import sut from './url-utils.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('url-utils', () => {
  let result;

  describe('removeTrailingSlashes', () => {
    const testCases = [
      {
        path: '/some-path/some-other-path',
        expectedResult: '/some-path/some-other-path'
      },
      {
        path: '/some-path/some-other-path/',
        expectedResult: '/some-path/some-other-path'
      },
      {
        path: '/some-path/some-other-path///',
        expectedResult: '/some-path/some-other-path'
      }
    ];

    testCases.forEach(({ path, expectedResult }) => {
      describe(`when path is '${path}'`, () => {
        beforeEach(() => {
          result = sut.removeTrailingSlashes(path);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });

  });

  describe('removeLeadingSlashes', () => {

    const testCases = [
      {
        path: 'some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path/'
      },
      {
        path: '/some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path/'
      },
      {
        path: '///some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path/'
      }
    ];

    testCases.forEach(({ path, expectedResult }) => {
      describe(`when path is '${path}'`, () => {
        beforeEach(() => {
          result = sut.removeLeadingSlashes(path);
        });
        it(`it should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('composeQueryString', () => {
    const testCases = [
      {
        input: {},
        expectedResult: ''
      },
      {
        input: { a: null },
        expectedResult: ''
      },
      {
        // eslint-disable-next-line no-undefined
        input: { a: undefined },
        expectedResult: ''
      },
      {
        input: { a: '', b: false },
        expectedResult: 'a=&b=false'
      },
      {
        input: { a: true, b: 3.239847 },
        expectedResult: 'a=true&b=3.239847'
      },
      {
        input: { a: 'Tom&Jerry', b: new Date('2022-07-19T15:57:33.984Z') },
        expectedResult: 'a=Tom%26Jerry&b=2022-07-19T15%3A57%3A33.984Z'
      }
    ];

    testCases.forEach(({ input, expectedResult }) => {
      describe(`when input is ${JSON.stringify(input)}`, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.composeQueryString(input);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });
  });

  describe('concatParts', () => {
    const testCases = [
      {
        parts: [null, ''],
        expectedResult: ''
      },
      {
        parts: ['abc', 'def', 'ghi'],
        expectedResult: 'abc/def/ghi'
      },
      {
        parts: ['abc', 0, 'ghi'],
        expectedResult: 'abc/0/ghi'
      },
      {
        parts: ['abc', false, 'ghi'],
        expectedResult: 'abc/false/ghi'
      },
      {
        parts: ['abc', null, 'ghi'],
        expectedResult: 'abc/ghi'
      },
      {
        parts: ['abc', '', 'ghi'],
        expectedResult: 'abc/ghi'
      }
    ];

    testCases.forEach(({ parts, expectedResult }) => {
      describe(`when parts are ${parts}`, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.concatParts(...parts);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });
  });

  describe('splitAtExtension', () => {
    const testCases = [
      {
        pathOrUrl: null,
        expectedResult: { baseName: '', extension: '' }
      },
      {
        pathOrUrl: '',
        expectedResult: { baseName: '', extension: '' }
      },
      {
        pathOrUrl: 'a',
        expectedResult: { baseName: 'a', extension: '' }
      },
      {
        pathOrUrl: 'a.mp3',
        expectedResult: { baseName: 'a', extension: '.mp3' }
      },
      {
        pathOrUrl: 'A.MP3',
        expectedResult: { baseName: 'A', extension: '.MP3' }
      },
      {
        pathOrUrl: '.gitignore',
        expectedResult: { baseName: '.gitignore', extension: '' }
      },
      {
        pathOrUrl: 'https://some.place/path/.gitignore',
        expectedResult: { baseName: 'https://some.place/path/.gitignore', extension: '' }
      },
      {
        pathOrUrl: 'https://some.place/path/a.mp3',
        expectedResult: { baseName: 'https://some.place/path/a', extension: '.mp3' }
      },
      {
        pathOrUrl: 'filename-without-extension',
        expectedResult: { baseName: 'filename-without-extension', extension: '' }
      },
      {
        pathOrUrl: 'https://some.place/path/filename-without-extension',
        expectedResult: { baseName: 'https://some.place/path/filename-without-extension', extension: '' }
      },
      {
        pathOrUrl: 'https://some.place/path.with.dots/filename-without-extension',
        expectedResult: { baseName: 'https://some.place/path.with.dots/filename-without-extension', extension: '' }
      },
      {
        pathOrUrl: 'filename-with-extension.mp3',
        expectedResult: { baseName: 'filename-with-extension', extension: '.mp3' }
      },
      {
        pathOrUrl: 'https://some.place/path/filename-with-extension.mp3',
        expectedResult: { baseName: 'https://some.place/path/filename-with-extension', extension: '.mp3' }
      }
    ];

    testCases.forEach(({ pathOrUrl, expectedResult }) => {
      it(`should return the correct result for pathOrUrl '${pathOrUrl}'`, () => {
        expect(sut.splitAtExtension(pathOrUrl)).toStrictEqual(expectedResult);
      });
    });
  });

  describe('isFullyQualifiedUrl', () => {
    const testCases = [
      {
        pathOrUrl: null,
        expectedResult: false
      },
      {
        pathOrUrl: 'abc',
        expectedResult: false
      },
      {
        pathOrUrl: '/abc',
        expectedResult: false
      },
      {
        pathOrUrl: './abc',
        expectedResult: false
      },
      {
        pathOrUrl: 'https://abc',
        expectedResult: true
      },
      {
        pathOrUrl: 'cdn://abc',
        expectedResult: true
      }
    ];

    testCases.forEach(({ pathOrUrl, expectedResult }) => {
      describe(`when pathOrUrl is ${pathOrUrl}`, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.isFullyQualifiedUrl(pathOrUrl);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });
  });

  describe('ensureIsFullyQualifiedUrl', () => {
    const testCases = [
      {
        pathOrUrl: 'abc',
        fallbackBase: 'https://mydomain.com/mypath/',
        expectedResult: 'https://mydomain.com/mypath/abc'
      },
      {
        pathOrUrl: '/abc',
        fallbackBase: 'https://mydomain.com/mypath/',
        expectedResult: 'https://mydomain.com/abc'
      },
      {
        pathOrUrl: './abc',
        fallbackBase: 'https://mydomain.com/mypath/',
        expectedResult: 'https://mydomain.com/mypath/abc'
      },
      {
        pathOrUrl: '../abc',
        fallbackBase: 'https://mydomain.com/mypath/',
        expectedResult: 'https://mydomain.com/abc'
      },
      {
        pathOrUrl: 'https://abc',
        fallbackBase: 'https://mydomain.com/mypath/',
        expectedResult: 'https://abc'
      },
      {
        pathOrUrl: 'cdn://abc',
        fallbackBase: 'https://mydomain.com/mypath/',
        expectedResult: 'cdn://abc'
      }
    ];

    testCases.forEach(({ pathOrUrl, fallbackBase, expectedResult }) => {
      describe(`when pathOrUrl is ${pathOrUrl} and fallbackBase is ${fallbackBase}`, () => {
        let actualResult;
        beforeEach(() => {
          actualResult = sut.ensureIsFullyQualifiedUrl(pathOrUrl, fallbackBase);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(actualResult).toBe(expectedResult);
        });
      });
    });
  });

});
