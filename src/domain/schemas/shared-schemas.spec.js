import { validate } from '../validation.js';
import uniqueId from '../../utils/unique-id.js';
import { sectionDBSchema, slugSchema } from './shared-schemas.js';

describe('slugSchema', () => {
  const testCases = [
    { description: 'trailing slash', slug: 'slug/', shouldSucceed: false },
    { description: 'double slash', slug: 'slug//slug', shouldSucceed: false },
    { description: 'upper case characters', slug: 'SLUUUUG', shouldSucceed: false },
    { description: 'slash followed by hyphon', slug: 'slug/-', shouldSucceed: true },
    { description: 'trailing hyphon', slug: 'slug-', shouldSucceed: true },
    { description: 'hypho slash hyphon', slug: 'slug-/-', shouldSucceed: true },
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

describe('sectionDBSchema', () => {
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
          expect(() => validate(section, sectionDBSchema)).not.toThrow();
        } else {
          expect(() => validate(section, sectionDBSchema)).toThrow();
        }
      });
    });
  });
});
