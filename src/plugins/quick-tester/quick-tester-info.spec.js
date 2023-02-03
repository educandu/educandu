import { TESTS_ORDER } from './constants.js';
import QuickTesterInfo from './quick-tester-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('quick-tester-info', () => {
  let sut;
  beforeEach(() => {
    sut = new QuickTesterInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the title', () => {
      const input = {
        title: '[Click me](cdn://room-media/12345/my-file.pdf)',
        teaser: '[Teaser]',
        tests: [],
        testsOrder: TESTS_ORDER.given
      };
      const result = sut.redactContent(input, '67890');
      expect(result.title).toBe('[Click me]()');
    });

    it('redacts the teaser', () => {
      const input = {
        title: '[Title]',
        teaser: '[Click me](cdn://room-media/12345/my-file.pdf)',
        tests: [],
        testsOrder: TESTS_ORDER.given
      };
      const result = sut.redactContent(input, '67890');
      expect(result.teaser).toBe('[Click me]()');
    });

    it('redacts the questions', () => {
      const input = {
        title: '[Title]',
        teaser: '[Teaser]',
        tests: [{ question: '[Click me](cdn://room-media/12345/my-file.pdf)', answer: '[Answer]' }],
        testsOrder: TESTS_ORDER.given
      };
      const result = sut.redactContent(input, '67890');
      expect(result.tests[0].question).toBe('[Click me]()');
    });

    it('redacts the answers', () => {
      const input = {
        title: '[Title]',
        teaser: '[Teaser]',
        tests: [{ question: '[Question]', answer: '[Click me](cdn://room-media/12345/my-file.pdf)' }],
        testsOrder: TESTS_ORDER.given
      };
      const result = sut.redactContent(input, '67890');
      expect(result.tests[0].answer).toBe('[Click me]()');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        title: '[Click me](cdn://room-media/12345/my-file.pdf)',
        teaser: '[Click me](cdn://room-media/12345/my-file.pdf)',
        tests: [],
        testsOrder: TESTS_ORDER.given
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from the title', () => {
      const result = sut.getCdnResources({
        title: 'This [hyperlink](cdn://document-media/my-file.pdf) and [another one](https://google.com)',
        teaser: '[Teaser]',
        tests: [],
        testsOrder: TESTS_ORDER.given
      });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });

    it('returns CDN resources from the teaser', () => {
      const result = sut.getCdnResources({
        title: '[Title]',
        teaser: 'This [hyperlink](cdn://document-media/my-file.pdf) and [another one](https://google.com)',
        tests: [],
        testsOrder: TESTS_ORDER.given
      });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });

    it('returns CDN resources from the questions', () => {
      const result = sut.getCdnResources({
        title: '[Title]',
        teaser: '[Teaser]',
        tests: [{ question: 'This [hyperlink](cdn://document-media/my-file.pdf) and [another one](https://google.com)', answer: '[Answer]' }],
        testsOrder: TESTS_ORDER.given
      });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });

    it('returns CDN resources from the answers', () => {
      const result = sut.getCdnResources({
        title: '[Title]',
        teaser: '[Teaser]',
        tests: [{ question: '[Question]', answer: 'This [hyperlink](cdn://document-media/my-file.pdf) and [another one](https://google.com)' }],
        testsOrder: TESTS_ORDER.given
      });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });
  });
});
