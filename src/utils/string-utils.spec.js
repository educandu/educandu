import { describe, expect, it } from 'vitest';
import { escapeHtml, escapeMarkdown, isLetter, kebabCaseToCamelCase, shorten, splitAroundWords } from './string-utils.js';

describe('string-utils', () => {

  describe('escapeHtml', () => {
    it('escapes all necessary characters', () => {
      const result = escapeHtml('if i > 0 && i < 10 then print "Hello World!"');
      expect(result).toBe('if i &gt; 0 &amp;&amp; i &lt; 10 then print &quot;Hello World!&quot;');
    });
  });

  describe('escapeMarkdown', () => {
    const markdown = [
      '#1!',
      '1 < 2',
      '* and text',
      '> not a quote',
      '< not a tag >',
      '[]',
      '____'
    ].join('\n\n');
    const expectedResult = [
      '\\#1!',
      '1 &lt; 2',
      '\\* and text',
      '&gt; not a quote',
      '&lt; not a tag &gt;',
      '\\[\\]',
      '\\_\\_\\_\\_'
    ].join('\n\n');
    it('escapes all necessary characters', () => {
      const result = escapeMarkdown(markdown);
      expect(result).toBe(expectedResult);
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

});
