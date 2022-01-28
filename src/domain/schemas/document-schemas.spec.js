import { validate } from '../validation.js';
import uniqueId from '../../utils/unique-id.js';
import { createRevisionBodySchema, documentSectionDBSchema } from './document-schemas.js';

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
        slug: null
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

describe('documentSectionDBSchema', () => {
  const validSection = {
    revision: uniqueId.create(),
    key: uniqueId.create(),
    deletedOn: new Date(),
    deletedBy: uniqueId.create(),
    deletedBecause: 'Some reason',
    type: 'plugin-type',
    content: null
  };
  const testCases = [
    { description: 'when valid section', section: validSection, shouldSucceed: true },
    {
      description: 'when invalid due to no key is provided',
      section: () => {
        const invalidSection = { ...validSection };
        delete invalidSection.key;
        return invalidSection;
      },
      shouldSucceed: false
    },
    {
      description: 'when invalid due to an invalid key is provided',
      section: () => {
        const invalidSection = { ...validSection };
        invalidSection.key = 'invalid key';
        return invalidSection;
      },
      shouldSucceed: false
    },
    {
      description: 'when invalid due to no revision is provided',
      section: () => {
        const invalidSection = { ...validSection };
        delete invalidSection.revision;
        return invalidSection;
      },
      shouldSucceed: false
    },
    {
      description: 'when invalid due to an invalid revision is provided',
      section: () => {
        const invalidSection = { ...validSection };
        invalidSection.revision = 'invalid revision key';
        return invalidSection;
      },
      shouldSucceed: false
    },
    {
      description: 'when invalid due to no type is provided',
      section: () => {
        const invalidSection = { ...validSection };
        delete invalidSection.type;
        return invalidSection;
      },
      shouldSucceed: false
    },
    {
      description: 'when invalid due to invalid date on deletedOn',
      section: () => {
        const invalidSection = { ...validSection };
        invalidSection.deletedOn = 'not a date';
        return invalidSection;
      },
      shouldSucceed: false
    },
    {
      description: 'when invalid due to invalid user id on deletedBy',
      section: () => {
        const invalidSection = { ...validSection };
        invalidSection.deletedBy = 'not a user id';
        return invalidSection;
      },
      shouldSucceed: false
    }
  ];

  testCases.forEach(({ description, section, shouldSucceed }) => {
    describe(description, () => {
      it(`should ${shouldSucceed ? 'not throw' : 'throw'}`, () => {
        if (shouldSucceed) {
          expect(() => validate(section, documentSectionDBSchema)).not.toThrow();
        } else {
          expect(() => validate(section, documentSectionDBSchema)).toThrow();
        }
      });
    });
  });
});
