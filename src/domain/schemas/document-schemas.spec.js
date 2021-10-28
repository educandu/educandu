import { validate } from '../validation.js';
import { createRevisionBodySchema, slugSchema } from './document-schemas.js';

describe('createRevisionBodySchema', () => {
  const happyPathData = {
    title: 'My Title',
    slug: 'my-slug',
    namespace: 'articles',
    language: 'en',
    sections: [
      {
        key: 'JD9fjjdj00e8jfkjdhjHNFLD436',
        type: 'markdown',
        content: {
          text: 'Hello world!'
        }
      }
    ]
  };

  const validTestCases = [
    {
      description: 'Happy path (new doc)',
      data: {
        ...happyPathData
      }
    },
    {
      description: 'Happy path (updated doc)',
      data: {
        ...happyPathData,
        appendTo: {
          key: 'ftg31hf714zmcmhWTUILD89z3',
          ancestorId: '9znDNV9HFNDELEUjnhjji4409uki8'
        }
      }
    },
    {
      description: 'Empty slug',
      data: {
        ...happyPathData,
        slug: ''
      }
    }
  ];

  const invalidTestCases = [
    {
      description: 'Invalid language',
      data: {
        ...happyPathData,
        language: 'DE'
      }
    },
    {
      description: 'Invalid namespace',
      data: {
        ...happyPathData,
        namespace: 'something-wrong'
      }
    },
    {
      description: 'Invalid slug',
      data: {
        ...happyPathData,
        slug: 'trailing-slash/'
      }
    },
    {
      description: 'Invalid title',
      data: {
        ...happyPathData,
        title: ''
      }
    },
    {
      description: 'Missing sections',
      data: {
        ...happyPathData,
        sections: null
      }
    },
    {
      description: 'Unknown section key',
      data: {
        ...happyPathData,
        sections: happyPathData.sections.map(s => ({ ...s, ancestorId: 'gh83z4g9hg9ztewioghuisghd' }))
      }
    }
  ];

  validTestCases.forEach(({ description, data }) => {
    describe(description, () => {
      it('should pass validation', () => expect(() => validate(data, createRevisionBodySchema)).not.toThrow());
    });
  });

  invalidTestCases.forEach(({ description, data }) => {
    describe(description, () => {
      it('should fail validation', () => expect(() => validate(data, createRevisionBodySchema)).toThrow());
    });
  });
});

describe('slugSchema', () => {
  const testCases = [
    { description: 'trailing hyphon', slug: 'slug-', shouldSucceed: false },
    { description: 'trailing slash', slug: 'slug/', shouldSucceed: false },
    { description: 'slash followed by hyphon', slug: 'slug/-', shouldSucceed: false },
    { description: 'hypho slash hyphon', slug: 'slug-/-', shouldSucceed: false },
    { description: 'upper case characters', slug: 'SLUUUUG', shouldSucceed: false },
    { description: 'lower case chars', slug: 'slug', shouldSucceed: true },
    { description: 'lower case chars and digits group', slug: 'slug123', shouldSucceed: true },
    { description: 'lower case chars and digits group separated by hyphon', slug: 'slug123-slug123', shouldSucceed: true },
    { description: 'lower case chars and digits group separated by hyphon and slash', slug: 'slug123-slug123/abc', shouldSucceed: true },
    { description: 'multiple valid groups separated by slashes', slug: 'slug123-slug123/abc-abc123-abc/def-def', shouldSucceed: true }
  ];

  testCases.forEach(({ description, slug, shouldSucceed }) => {
    describe(description, () => {
      it(`should ${shouldSucceed ? 'not throw' : 'throw'}`, () => {
        if (shouldSucceed) {
          expect(() => validate(slug, slugSchema)).not.toThrow();
        } else {
          expect(() => validate(slug, slugSchema)).toThrow();
        }
      });
    });
  });
});
