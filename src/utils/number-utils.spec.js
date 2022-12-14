import { describe, it, expect } from 'vitest';
import { getNumberFromString } from './number-utils.js';

describe('number-utils', () => {

  describe('getNumberFromString', () => {
    describe('when called with a string without digits', () => {
      it('returns null', () => {
        expect(getNumberFromString('hello world')).toBe(null);
      });
    });

    describe('when called with a string with digits', () => {
      it('returns the extracted digits as a number', () => {
        expect(getNumberFromString('hello 123 world')).toBe(123);
      });
    });

    describe('when called with a string with digits in multiple groups', () => {
      it('returns all the extracted digits as a number', () => {
        expect(getNumberFromString('hello 123 and 4 world')).toBe(1234);
      });
    });
  });
});
