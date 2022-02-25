import { escapeHtml, kebabCaseToCamelCase, shorten } from './string-utils.js';

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
    it('will return a falsy value as empty string', () => {
      const result = shorten(null, 5);
      expect(result).toBe('');
    });
    it('will return empty string as is', () => {
      const result = shorten('', 5);
      expect(result).toBe('');
    });
    it('will return a string that has exactly the `maxLength` unchanged', () => {
      const result = shorten('12345', 5);
      expect(result).toBe('12345');
    });
    it('will return a string that is longer than `maxLength` trimmed to `maxLength`', () => {
      const result = shorten('123456', 5);
      expect(result).toBe('1234…');
    });
  });

});
