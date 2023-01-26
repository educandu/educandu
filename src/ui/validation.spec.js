import { createSandbox } from 'sinon';
import { afterEach, describe, expect, it } from 'vitest';
import {
  validateUrl,
  MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS
} from './validation.js';

describe('validation', () => {
  const sandbox = createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

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
    const t = sandbox.fake();

    const testCases = [
      {
        url: '',
        allowEmpty: true,
        expectedResult: 'success'
      },
      {
        input: '',
        allowEmpty: false,
        expectedResult: 'error'
      },
      {
        input: 'https://google.com',
        allowEmpty: true,
        expectedResult: 'success'
      },
      {
        input: 'http://google.com',
        allowEmpty: true,
        expectedResult: 'success'
      },
      {
        input: 'mailto:test@test.com',
        allowEmpty: true,
        expectedResult: 'error'
      },
      {
        input: 'google',
        allowEmpty: true,
        expectedResult: 'error'
      }
    ];

    testCases.forEach(({ input, allowEmpty, expectedResult }) => {
      describe(`when input is '${input}' and allowEmpty is ${allowEmpty}`, () => {
        it(`should return '${expectedResult}'`, () => {
          expect(validateUrl({ url: input, allowEmpty, t }).validateStatus).toBe(expectedResult);
        });
      });
    });
  });

});
