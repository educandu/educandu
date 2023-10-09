import { describe, expect, it } from 'vitest';
import { ensureKeyIsExcluded } from './object-utils.js';

describe('object-utils', () => {

  describe('ensureKeyIsExcluded', () => {
    it('returns the original object if the key was not included anyway in the original object', () => {
      const input = { a: 'a' };
      const result = ensureKeyIsExcluded(input, 'b');
      expect(result).toBe(input);
    });
    it('returns a new object with the key removed if it was included in the original object', () => {
      const input = { a: 'a', b: 'b' };
      const result = ensureKeyIsExcluded(input, 'b');
      expect(result).toEqual({ a: 'a' });
    });
    it('does not mutate the original object if the key was included in the original object', () => {
      const input = { a: 'a', b: 'b' };
      const result = ensureKeyIsExcluded(input, 'b');
      expect(result).not.toBe(input);
      expect(input).toEqual({ a: 'a', b: 'b' });
    });
    it('creates only shallow clones, leaving sub-objects referentially identical', () => {
      const input = { a: { sub: 'a' }, b: 'b' };
      const result = ensureKeyIsExcluded(input, 'b');
      expect(result.a).toBe(input.a);
    });
  });
});
