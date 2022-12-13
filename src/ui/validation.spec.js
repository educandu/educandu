import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import {
  validateUrl,
  URL_VALIDATION_STATUS,
  getUrlValidationStatus,
  MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS
} from './validation.js';

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

describe('getUrlValidationStatus', () => {
  const testCases = [
    {
      input: '',
      options: { allowEmpty: true, allowHttp: false, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.valid
    },
    {
      input: '',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.empty
    },
    {
      input: 'https://google.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.valid
    },
    {
      input: 'http://google.com',
      options: { allowEmpty: false, allowHttp: true, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.valid
    },
    {
      input: 'http://google.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.invalidProtocol
    },
    {
      input: 'mailto:test@test.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: true },
      expectedResult: URL_VALIDATION_STATUS.valid
    },
    {
      input: 'mailto:test@test.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.invalidProtocol
    },
    {
      input: 'google',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: URL_VALIDATION_STATUS.invalidFormat
    }
  ];

  testCases.forEach(({ input, options, expectedResult }) => {
    describe(`when input is '${input}'`, () => {
      describe(`and options are '${JSON.stringify(options)}'`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(getUrlValidationStatus(input, options)).toBe(expectedResult);
        });
      });
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
      input: 'https://google.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: 'success'
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
      input: 'mailto:test@test.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: 'error'
    },
    {
      input: 'mailto:test@test.com',
      options: { allowEmpty: false, allowHttp: false, allowMailto: true },
      expectedResult: 'success'
    },
    {
      input: 'google',
      options: { allowEmpty: false, allowHttp: false, allowMailto: false },
      expectedResult: 'error'
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
