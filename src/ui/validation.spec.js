import { MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS } from './validation.js';

describe('MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS', () => {
  const nonMatchingCases = [
    '# Hello World',
    '### Hello World',
    '# Hello World #',
    '### Hello World ###',
    '# Hello **World**',
    '# Hello **World** #',
    '#Hello **World**',
    '#Hello **World**#'
  ];

  nonMatchingCases.forEach(text => {
    it(`should not match '${text}'`, () => {
      expect(MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS.test(text)).toBe(false);
    });
  });

  const matchingCases = [
    '# *Hello World*',
    '### **Hello World**',
    '# _Hello World_ #',
    '### __Hello World__ ###',
    '# _Hello **World**_',
    '# __Hello *World*__ #',
    '#*Hello World*',
    '#*Hello World*#'
  ];

  matchingCases.forEach(text => {
    it(`should match '${text}'`, () => {
      expect(MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS.test(text)).toBe(true);
    });
  });

});
