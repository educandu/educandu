import { validate } from '../validation';
import { createRevisionBodySchema } from './document-schemas';

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
      it('should pass', () => expect(() => validate(data, createRevisionBodySchema)).not.toThrow());
    });
  });

  invalidTestCases.forEach(({ description, data }) => {
    describe(description, () => {
      it('should fail', () => expect(() => validate(data, createRevisionBodySchema)).toThrow());
    });
  });
});
