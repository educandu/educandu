import { validate } from '../validation.js';
import { describe, expect, it } from 'vitest';
import { slugSchema, emailSchema } from './shared-schemas.js';

describe('slugSchema', () => {
  const testCases = [
    { description: 'empty slug', slug: '', shouldSucceed: true },
    { description: 'a normal slug', slug: 'normal/will-be/normal', shouldSucceed: true },
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

describe('emailSchema', () => {
  const testCases = [
    { description: 'null value', email: null, shouldSucceed: false },
    { description: 'empty string', email: '', shouldSucceed: false },
    { description: 'a invalid email', email: 't:st@test.com', shouldSucceed: false },
    { description: 'a valid email containing only ASCII characters', email: 'test@test.com', shouldSucceed: true },
    { description: 'a valid email containing also non-ASCII characters', email: 'Täst@test.com', shouldSucceed: true }
  ];

  testCases.forEach(({ description, email, shouldSucceed }) => {
    describe(description, () => {
      it(`should ${shouldSucceed ? 'not throw' : 'throw'}`, () => {
        if (shouldSucceed) {
          expect(() => validate(email, emailSchema)).not.toThrow();
        } else {
          expect(() => validate(email, emailSchema)).toThrow();
        }
      });
    });
  });
});
