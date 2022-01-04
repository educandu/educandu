import { validate } from '../validation.js';
import { createRevisionBodySchema } from './document-schemas.js';

describe('createRevisionBodySchema', () => {
  const documentRevision = {
    title: 'My Title',
    slug: 'my-slug',
    language: 'en',
    sections: [
      {
        key: 'JD9fjjdj00e8jfkjdhjHNFLD436',
        type: 'markdown',
        content: {
          text: 'Hello world!'
        }
      }
    ],
    tags: []
  };

  const validTestCases = [
    {
      description: 'a valid first revision',
      data: {
        ...documentRevision
      }
    },
    {
      description: 'a valid additional revision',
      data: {
        ...documentRevision,
        appendTo: {
          key: 'ftg31hf714zmcmhWTUILD89z3',
          ancestorId: '9znDNV9HFNDELEUjnhjji4409uki8'
        }
      }
    },
    {
      description: 'a revision having an empty slug',
      data: {
        ...documentRevision,
        slug: ''
      }
    }
  ];

  const invalidTestCases = [
    {
      description: 'a revision with an invalid language',
      data: {
        ...documentRevision,
        language: 'DE'
      }
    },
    {
      description: 'a revision with an invalid slug',
      data: {
        ...documentRevision,
        slug: 'trailing-slash/'
      }
    },
    {
      description: 'a revision with an invalid title',
      data: {
        ...documentRevision,
        title: ''
      }
    },
    {
      description: 'a revision with missing sections',
      data: {
        ...documentRevision,
        sections: null
      }
    },
    {
      description: 'a revision with an unknown section key',
      data: {
        ...documentRevision,
        sections: documentRevision.sections.map(s => ({ ...s, ancestorId: 'gh83z4g9hg9ztewioghuisghd' }))
      }
    },
    {
      description: 'a revision tags that are not of type string',
      data: {
        ...documentRevision,
        tags: [1, {}, false, null]
      }
    }
  ];

  validTestCases.forEach(({ description, data }) => {
    describe(`When called with ${description}`, () => {
      it('should pass validation', () => expect(() => validate(data, createRevisionBodySchema)).not.toThrow());
    });
  });

  invalidTestCases.forEach(({ description, data }) => {
    describe(`When called with ${description}`, () => {
      it('should fail validation', () => expect(() => validate(data, createRevisionBodySchema)).toThrow());
    });
  });
});
