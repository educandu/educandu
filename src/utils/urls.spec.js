import sut from './urls.js';

describe('urls', () => {
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
        slug: 'slug/slugathor',
        expectedResult: '/docs/key/slug/slugathor'
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
      },
      {
        key: 'key',
        slug: 'slug',
        view: 'edit',
        templateDocumentKey: 'XrF7z7jyDrNFkvH7eyj5T',
        expectedResult: '/docs/key/slug?view=edit&templateDocumentKey=XrF7z7jyDrNFkvH7eyj5T'
      }
    ];

    testCases.forEach(({ key, slug, view, templateDocumentKey, expectedResult }) => {
      describe(`when key is '${key}', slug is '${slug}', view is '${view}' and templateDocumentKey is '${templateDocumentKey}'`, () => {
        beforeEach(() => {
          result = sut.getDocUrl({ key, slug, view, templateDocumentKey });
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('getLessonUrl', () => {
    const testCases = [
      {
        id: 'id',
        slug: null,
        expectedResult: '/lessons/id'
      },
      {
        id: 'id',
        slug: 'slug',
        expectedResult: '/lessons/id/slug'
      },
      {
        id: 'id',
        slug: 'slug',
        expectedResult: '/lessons/id/slug'
      },
      {
        id: 'id',
        slug: 's l u g',
        expectedResult: '/lessons/id/s%20l%20u%20g'
      },
      {
        id: 'id',
        slug: 's l u g-part1/slug-part-2',
        expectedResult: '/lessons/id/s%20l%20u%20g-part1/slug-part-2'
      },
      {
        id: 'id',
        slug: 'lesson-slug',
        view: 'edit',
        expectedResult: '/lessons/id/lesson-slug?view=edit'
      }
    ];

    testCases.forEach(({ id, slug, view, expectedResult }) => {
      describe(`when id is '${id}', slug is '${slug}' and view is '${view}'`, () => {
        beforeEach(() => {
          result = sut.getLessonUrl({ id, slug, view });
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('getDocIdIfDocUrl', () => {
    const testCases = [
      { url: '', expectedResult: null },
      { url: '/other-page/AfnjsHSA783nf88fds', expectedResult: null },
      { url: 'docs/AfnjsHSA783nf88fds', expectedResult: null },
      { url: '/docs/AfnjsHSA783nf88fds', expectedResult: 'AfnjsHSA783nf88fds' },
      { url: '/docs/AfnjsHSA783nf88fds/', expectedResult: 'AfnjsHSA783nf88fds' },
      { url: '/docs/AfnjsHSA783nf88fds/metadata', expectedResult: 'AfnjsHSA783nf88fds' },
      { url: '/docs/AfnjsHSA783nf88fds?query=value', expectedResult: 'AfnjsHSA783nf88fds' }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when url is '${url}'`, () => {
        beforeEach(() => {
          result = sut.getDocIdIfDocUrl(url);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  describe('getLessonIdIfLessonUrl', () => {
    const testCases = [
      { url: '', expectedResult: null },
      { url: '/other-page/AfnjsHSA783nf88fds', expectedResult: null },
      { url: 'lessons/AfnjsHSA783nf88fds', expectedResult: null },
      { url: '/lessons/AfnjsHSA783nf88fds', expectedResult: 'AfnjsHSA783nf88fds' },
      { url: '/lessons/AfnjsHSA783nf88fds/', expectedResult: 'AfnjsHSA783nf88fds' },
      { url: '/lessons/AfnjsHSA783nf88fds/metadata', expectedResult: 'AfnjsHSA783nf88fds' },
      { url: '/lessons/AfnjsHSA783nf88fds?query=value', expectedResult: 'AfnjsHSA783nf88fds' }
    ];

    testCases.forEach(({ url, expectedResult }) => {
      describe(`when url is '${url}'`, () => {
        beforeEach(() => {
          result = sut.getLessonIdIfLessonUrl(url);
        });
        it(`should return '${expectedResult}'`, () => {
          expect(result).toBe(expectedResult);
        });
      });
    });
  });
});
