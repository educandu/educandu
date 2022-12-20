import { describe, expect, it } from 'vitest';
import { createShortHash, escapeHtml, isLetter, kebabCaseToCamelCase, shorten, splitAroundWords } from './string-utils.js';

describe('string-utils', () => {

  describe('escapeHtml', () => {
    it('escapes all necessary characters', () => {
      const result = escapeHtml('if i > 0 && i < 10 then print "Hello World!"');
      expect(result).toBe('if i &gt; 0 &amp;&amp; i &lt; 10 then print &quot;Hello World!&quot;');
    });
  });

  describe('kebabCaseToCamelCase', () => {
    it('converts kebab to camel case', () => {
      const result = kebabCaseToCamelCase('just-my-2-cents');
      expect(result).toBe('justMy2Cents');
    });
  });

  describe('shorten', () => {
    it('returns a falsy value as empty string', () => {
      const result = shorten(null, 5);
      expect(result).toBe('');
    });
    it('returns empty string as is', () => {
      const result = shorten('', 5);
      expect(result).toBe('');
    });
    it('returns a string that has exactly the `maxLength` unchanged', () => {
      const result = shorten('12345', 5);
      expect(result).toBe('12345');
    });
    it('returns a string that is longer than `maxLength` trimmed to `maxLength`', () => {
      const result = shorten('123456', 5);
      expect(result).toBe('1234…');
    });
  });

  describe('isLetter', () => {
    it('returns true for Unicode letters', () => {
      expect(isLetter('Löß')).toBe(true);
    });
  });

  describe('splitAroundWords', () => {
    it('returns an array of tokens keeping all words intact', () => {
      const result = splitAroundWords('Wörter und Zeichen/Sonderzeichen und Café!');
      expect(result).toStrictEqual(['Wörter', ' ', 'und', ' ', 'Zeichen', '/', 'Sonderzeichen', ' ', 'und', ' ', 'Café', '!']);
    });
  });

  describe('createShortHash', () => {
    it('returns the same hash code for the same input', () => {
      const result1 = createShortHash('Hello World!');
      const result2 = createShortHash('Hello World!');
      expect(result1).toBe(result2);
    });
  });

});
