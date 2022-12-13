import { beforeEach, describe, expect, it } from 'vitest';
import InteractiveMediaInfo from './interactive-media-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('interactive-media-info', () => {
  let sut;
  let result;
  let content;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new InteractiveMediaInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: `[Click me](cdn://rooms/${currentRoomId}/media/my-file.pdf)`
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.copyrightNotice).toBe('[Click me]()');
    });

    it('redacts the media source url', () => {
      content = {
        sourceUrl: `rooms/${currentRoomId}/media/my-video.mp4`,
        copyrightNotice: ''
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        sourceUrl: `rooms/${currentRoomId}/media/my-video.mp4`,
        copyrightNotice: `[Click me](cdn://rooms/${currentRoomId}/media/my-file.pdf)`
      };
      result = sut.redactContent(content, currentRoomId);
      expect(result).toStrictEqual(content);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from copyrightNotice', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: 'This [hyperlink](cdn://media/my-file.pdf) and [another one](https://google.com)'
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual(['cdn://media/my-file.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        sourceUrl: 'https://youtube.com/something',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        sourceUrl: 'https://someplace.com/video.mp4',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        sourceUrl: null,
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      content = {
        sourceUrl: 'cdn://media/12345/some-video.mp4',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual(['cdn://media/12345/some-video.mp4']);
    });

    it('returns a list with the url for an internal private resource', () => {
      content = {
        sourceUrl: 'cdn://rooms/12345/media/some-video.mp4',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual(['cdn://rooms/12345/media/some-video.mp4']);
    });
  });
});
