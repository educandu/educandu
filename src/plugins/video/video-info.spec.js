import VideoInfo from './video-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('video-info', () => {
  let sut;
  beforeEach(() => {
    sut = new VideoInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      const input = {
        sourceUrl: '',
        posterImage: {},
        copyrightNotice: '[Click me](cdn://room-media/12345/my-file.pdf)'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.copyrightNotice).toBe('[Click me]()');
    });

    it('redacts the video source url', () => {
      const input = {
        sourceUrl: 'cdn://room-media/12345/my-video.mp4',
        posterImage: {},
        copyrightNotice: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the video source url', () => {
      const input = {
        sourceUrl: 'cdn://room-media/12345/my-video.mp4',
        posterImage: {},
        copyrightNotice: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the poster image url', () => {
      const input = {
        sourceUrl: 'https://somewhere-over-the-rainbow.com/my-video.mp4',
        posterImage: {
          sourceUrl: 'cdn://room-media/12345/my-image.jpg'
        },
        copyrightNotice: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.posterImage.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceUrl: 'cdn://room-media/12345/my-video.mp4',
        posterImage: {
          sourceUrl: 'cdn://room-media/12345/my-image.jpg'
        },
        copyrightNotice: '[Click me](cdn://room-media/12345/my-file.pdf)'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from copyrightNotice', () => {
      const result = sut.getCdnResources({
        sourceUrl: '',
        posterImage: {},
        copyrightNotice: 'This [hyperlink](cdn://document-media/my-file.pdf) and [another one](https://google.com)'
      });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'https://youtube.com/something',
        posterImage: {},
        copyrightNotice: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'https://someplace.com/video.mp4',
        posterImage: {},
        copyrightNotice: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceUrl: null,
        posterImage: {},
        copyrightNotice: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'cdn://document-media/some-video.mp4',
        posterImage: {},
        copyrightNotice: ''
      });
      expect(result).toEqual(['cdn://document-media/some-video.mp4']);
    });

    it('returns a list with the url for an internal resource with an internal poster image resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'cdn://document-media/some-video.mp4',
        posterImage: {
          sourceUrl: 'cdn://document-media/some-image.jpeg'
        },
        copyrightNotice: ''
      });
      expect(result).toEqual([
        'cdn://document-media/some-video.mp4',
        'cdn://document-media/some-image.jpeg'
      ]);
    });
  });
});
