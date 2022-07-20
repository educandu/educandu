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
        templateDocumentId: 'XrF7z7jyDrNFkvH7eyj5T',
        expectedResult: '/docs/_id/slug?view=edit&templateDocumentId=XrF7z7jyDrNFkvH7eyj5T'
      }
    ];

    testCases.forEach(({ id, slug, view, templateDocumentId, expectedResult }) => {
      describe(`when id is '${id}', slug is '${slug}', view is '${view}' and templateDocumentId is '${templateDocumentId}'`, () => {
        beforeEach(() => {
          result = sut.getDocUrl({ id, slug, view, templateDocumentId });
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
});
