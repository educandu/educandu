import { describe, it, expect } from 'vitest';
import { getNumberFromString } from './number-utils.js';

describe('number-utils', () => {

  describe('getNumberFromString', () => {
    describe('when called with a string not containing a number', () => {
      it('returns null', () => {
        expect(getNumberFromString('hello world')).toBe(null);
      });
    });

    describe('when called with a string containing a number without decimals', () => {
      it('returns the extracted float', () => {
        expect(getNumberFromString('hello 123 world')).toBe(123);
      });
    });

    describe('when called with a string containing a negative number with decimals', () => {
      it('returns all the extracted float', () => {
        expect(getNumberFromString('hello -12.3 world')).toBe(-12.3);
      });
    });
  });
});
