import sut from './urls.js';

describe('order-store-base', () => {
  let result;

  describe('removeTrailingSlash', () => {

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
          result = sut.removeTrailingSlash(path);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });

  });

  describe('removeLeadingSlash', () => {

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
          result = sut.removeLeadingSlash(path);
        });
        it(`it should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });

  });

  describe('trimSlashes', () => {
    const testCases = [
      {
        path: null,
        expectedResult: 'null'
      },
      {
        path: 'some-path/some-other-path',
        expectedResult: 'some-path/some-other-path'
      },
      {
        path: '/some-path/some-other-path/',
        expectedResult: 'some-path/some-other-path'
      },
      {
        path: '///some-path/some-other-path///',
        expectedResult: 'some-path/some-other-path'
      }
    ];

    testCases.forEach(({ path, expectedResult }) => {
      describe(`when path is '${path}'`, () => {
        beforeEach(() => {
          result = sut.trimSlashes(path);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });

  });

  describe('concatParts', () => {
    const testCases = [
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

  describe('getDocUrl', () => {
    const testCases = [
      {
        key: 'key',
        slug: null,
        expectedResult: '/docs/key'
      },
      {
        key: 'key',
        slug: 'slug',
        expectedResult: '/docs/key/slug'
      },
      {
        key: 'key',
        slug: 'slug',
        expectedResult: '/docs/key/slug'
      },
      {
        key: 'key',
        slug: 's l u g',
        expectedResult: '/docs/key/s%20l%20u%20g'
      },
      {
        key: 'key',
        slug: 's l u g-part1/slug-part-2',
        expectedResult: '/docs/key/s%20l%20u%20g-part1/slug-part-2'
      }
    ];

    testCases.forEach(({ key, slug, expectedResult }) => {
      describe(`when key is '${key}' and slug is '${slug}'`, () => {
        beforeEach(() => {
          result = sut.getDocUrl(key, slug);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });
});
