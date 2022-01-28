import { validate } from '../validation.js';
import { slugSchema } from './shared-schemas.js';

describe('slugSchema', () => {
  const testCases = [
    { description: 'empty string', slug: '', shouldSucceed: true },
    { description: 'a normal string', slug: 'normal will be normal', shouldSucceed: true },
    { description: 'null value', slug: null, shouldSucceed: false }
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

