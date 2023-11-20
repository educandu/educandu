import { beforeEach, describe, expect, it } from 'vitest';
import {
  escapeHtml,
  escapeMarkdown,
  hasMoreWordCharactersThanNonWordCharacters,
  isLetter,
  kebabCaseToCamelCase,
  prettyPrintValue,
  shorten,
  splitAroundWords
} from './string-utils.js';

describe('string-utils', () => {

  describe('hasMoreWordCharactersThanNonWordCharacters', () => {
    const testCases = [
      { input: '---', expectedResult: false },
      { input: '---abc', expectedResult: false },
      { input: '--abc', expectedResult: true },
      { input: 'abc', expectedResult: true }
    ];
    testCases.forEach(({ input, expectedResult }) => {
      describe(`for input '${input}'`, () => {
        let result;
        beforeEach(() => {
          result = hasMoreWordCharactersThanNonWordCharacters(input);
        });
        it(`should return ${expectedResult}`, () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });

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

  describe('prettyPrintValue', () => {
    const testCases = [
      {
        description: 'when the object is empty',
        objectToPrint: {},
        expectedResult: ''
      },
      {
        description: 'when the object has only values that can be rendered in one line',
        objectToPrint: {
          a: 'a',
          b: 1,
          c: 1n,
          d: true,
          e: null,
          // eslint-disable-next-line no-undefined
          f: undefined,
          g: Symbol('this is a symbol'),
          h: function h() { return 'h'; },
          i: new Date('2023-03-31T12:00:00.000Z')
        },
        expectedResult: [
          'a: a',
          'b: 1',
          'c: 1',
          'd: true',
          'e: (null)',
          'f: (undefined)',
          'g: (symbol)',
          'h: (function)',
          'i: 2023-03-31T12:00:00.000Z'
        ].join('\n')
      },
      {
        description: 'when the object has nested objects',
        objectToPrint: {
          a: 'a',
          b: {
            ba: 'ba',
            bb: {
              bba: 'bba'
            }
          },
          c: new Date('2023-03-31T12:00:00.000Z')
        },
        expectedResult: [
          'a: a',
          'b:',
          '  ba: ba',
          '  bb:',
          '    bba: bba',
          'c: 2023-03-31T12:00:00.000Z'
        ].join('\n')
      },
      {
        description: 'when the object has nested objects and arrays',
        objectToPrint: {
          a: '',
          b: {
            ba: ['ba1', { ba2: 'ba2', ba3: 'ba3' }, null],
            bb: []
          },
          c: new Date('2023-03-31T12:00:00.000Z')
        },
        expectedResult: [
          'a: (empty)',
          'b:',
          '  ba:',
          '    - ba1',
          '    - ba2: ba2',
          '      ba3: ba3',
          '    - (null)',
          '  bb: (empty)',
          'c: 2023-03-31T12:00:00.000Z'
        ].join('\n')
      }
    ];
    testCases.forEach(({ description, objectToPrint, expectedResult }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = prettyPrintValue(objectToPrint);
        });
        it('should return the expected result', () => {
          expect(result).toStrictEqual(expectedResult);
        });
      });
    });
  });
});
