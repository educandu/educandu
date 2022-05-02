import sinon from 'sinon';
import { MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS, validateUrl } from './validation.js';

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

describe('validateUrl', () => {
  const t = sinon.fake();

  const testCases = [
    {
      input: '',
      options: { allowEmpty: true, allowHttp: false, allowMailto: false },
      expectedResult: 'success'
    },
    {
      input: '',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: 'warning'
    },
    {
      input: 'http://google.com',
      options: { allowEmpty: false, allowHttp: true, allowMailto: false },
      expectedResult: 'success'
    },
    {
      input: 'http://google.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: 'error'
    },
    {
      input: 'https://google.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: 'success'
    },
    {
      input: 'mailto:test@test.com',
      options: { allowEmpty: true, allowHttp: true, allowMailto: false },
      expectedResult: 'error'
    },
    {
      input: 'mailto:test@test.com',
      options: { allowEmpty: true, allowHttp: true, allowMailto: true },
      expectedResult: 'success'
    }
  ];

  testCases.forEach(({ input, options, expectedResult }) => {
    describe(`when input is '${input}'`, () => {
      describe(`and options are '${JSON.stringify(options)}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(validateUrl(input, t, options).validateStatus).toBe(expectedResult);
        });
      });
    });
  });
});
