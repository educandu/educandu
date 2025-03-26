import { beforeEach, describe, expect, it } from 'vitest';
import FileUploadFieldInfo from './file-upload-field-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('file-upload-field-info', () => {
  let sut;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new FileUploadFieldInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts all unreachable resources', () => {
      const result = sut.redactContent({
        label: `We have a link here: <cdn://room-media/${currentRoomId}/my-file-1.pdf>, and here: <https://google.com>`
      }, otherRoomId);
      expect(result).toStrictEqual({
        label: 'We have a link here: <>, and here: <https://google.com>'
      });
    });
    it('keeps reachable resources intact', () => {
      const result = sut.redactContent({
        label: `We have a link here: <cdn://room-media/${otherRoomId}/my-file-1.pdf>`
      }, otherRoomId);
      expect(result).toStrictEqual({
        label: `We have a link here: <cdn://room-media/${otherRoomId}/my-file-1.pdf>`
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns a list with all referenced internal URLs', () => {
      const result = sut.getCdnResources({
        label: 'Some label with [internal link](cdn://media-library/some-pdf-1.png) and [external link](https://google.com)'
      });
      expect(result).toStrictEqual([
        'cdn://media-library/some-pdf-1.png'
      ]);
    });
  });
});
