import SelectFieldInfo from './select-field-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('select-field-info', () => {
  let sut;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new SelectFieldInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts all unreachable resources', () => {
      const result = sut.redactContent({
        label: `We have a link here: <cdn://room-media/${currentRoomId}/my-file-1.pdf>, and here: <https://google.com>`,
        items: [{ text: '' }, { text: `[Click here](cdn://room-media/${currentRoomId}/my-file-1.pdf)` }]
      }, otherRoomId);
      expect(result).toStrictEqual({
        label: 'We have a link here: <>, and here: <https://google.com>',
        items: [{ text: '' }, { text: '[Click here]()' }]
      });
    });
    it('keeps reachable resources intact', () => {
      const result = sut.redactContent({
        label: `We have a link here: <cdn://room-media/${otherRoomId}/my-file-1.pdf>`,
        items: [{ text: '' }, { text: `[Click here](cdn://room-media/${otherRoomId}/my-file-1.pdf)` }]
      }, otherRoomId);
      expect(result).toStrictEqual({
        label: `We have a link here: <cdn://room-media/${otherRoomId}/my-file-1.pdf>`,
        items: [{ text: '' }, { text: `[Click here](cdn://room-media/${otherRoomId}/my-file-1.pdf)` }]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns a list with all referenced internal URLs', () => {
      const result = sut.getCdnResources({
        label: 'Some label with [internal link](cdn://media-library/some-pdf-1.png) and [external link](https://google.com)',
        items: [{ text: '' }, { text: '[Click here](cdn://media-library/my-file-1.pdf)' }]
      });
      expect(result).toStrictEqual([
        'cdn://media-library/some-pdf-1.png',
        'cdn://media-library/my-file-1.pdf'
      ]);
    });
  });
});
