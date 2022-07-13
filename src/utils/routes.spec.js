import sut from './routes.js';

describe('routes', () => {
  let result;

  describe('getDocUrl', () => {
    const testCases = [
      {
        id: '_id',
        slug: null,
        expectedResult: '/docs/_id'
      },
      {
        id: '_id',
        slug: 'slug',
        expectedResult: '/docs/_id/slug'
      },
      {
        id: '_id',
        slug: 'slug/slugathor',
        expectedResult: '/docs/_id/slug/slugathor'
      },
      {
        id: '_id',
        slug: 's l u g',
        expectedResult: '/docs/_id/s%20l%20u%20g'
      },
      {
        id: '_id',
        slug: 's l u g-part1/slug-part-2',
        expectedResult: '/docs/_id/s%20l%20u%20g-part1/slug-part-2'
      },
      {
        id: '_id',
        slug: 'slug',
        view: 'edit',
        templateDocumentKey: 'XrF7z7jyDrNFkvH7eyj5T',
        expectedResult: '/docs/_id/slug?view=edit&templateDocumentKey=XrF7z7jyDrNFkvH7eyj5T'
      }
    ];

    testCases.forEach(({ id, slug, view, templateDocumentKey, expectedResult }) => {
      describe(`when id is '${id}', slug is '${slug}', view is '${view}' and templateDocumentKey is '${templateDocumentKey}'`, () => {
        beforeEach(() => {
          result = sut.getDocUrl({ id, slug, view, templateDocumentKey });
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
