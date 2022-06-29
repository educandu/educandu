import sut from './url-utils.js';

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
