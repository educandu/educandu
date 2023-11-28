import MediaAnalysisInfo from './media-analysis-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('media-analysis-info', () => {
  let sut;
  let result;
  let content;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new MediaAnalysisInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      content = {
        copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`,
        posterImage: {
          sourceUrl: ''
        }
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.copyrightNotice).toBe('[Click me]()');
    });

    it('redacts the media source url', () => {
      content = {
        sourceUrl: `cdn://room-media/${currentRoomId}/my-video-1.mp4`,
        copyrightNotice: '',
        posterImage: {
          sourceUrl: `cdn://room-media/${currentRoomId}/my-photo.jpeg`
        }
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.sourceUrl).toBe('');
      expect(result.posterImage.sourceUrl).toBe('');
    });

    it('redacts the poster image source url', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: '',
        posterImage: {
          sourceUrl: `cdn://room-media/${currentRoomId}/my-image.jpg`
        }
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.posterImage.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        sourceUrl: `cdn://room-media/${currentRoomId}/my-file-1.pdf`,
        copyrightNotice: '',
        posterImage: {
          sourceUrl: `cdn://room-media/${currentRoomId}/my-image.jpg`
        }
      };
      result = sut.redactContent(content, currentRoomId);
      expect(result).toStrictEqual(content);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from copyrightNotice', () => {
      content = {
        sourceUrl: '',
        copyrightNotice: 'This [hyperlink](cdn://media-library/my-file-1.pdf) and [another one](https://google.com)',
        posterImage: {
          sourceUrl: ''
        }
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual(['cdn://media-library/my-file-1.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        sourceUrl: 'https://youtube.com/something',
        copyrightNotice: '',
        posterImage: {
          sourceUrl: ''
        }
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        sourceUrl: 'https://someplace.com/video.mp4',
        copyrightNotice: '',
        posterImage: {
          sourceUrl: 'https://someplace.com/image.jpg'
        }
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        sourceUrl: null,
        copyrightNotice: '',
        posterImage: {
          sourceUrl: ''
        }
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      content = {
        sourceUrl: 'cdn://media-library/some-video-1.mp4',
        copyrightNotice: '',
        posterImage: {
          sourceUrl: 'cdn://media-library/some-image.jpg'
        }
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://media-library/some-video-1.mp4',
        'cdn://media-library/some-image.jpg'
      ]);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      content = {
        sourceUrl: 'cdn://room-media/12345/some-video-1.mp4',
        copyrightNotice: '',
        posterImage: {
          sourceUrl: 'cdn://room-media/12345/some-image.jpg'
        }
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://room-media/12345/some-video-1.mp4',
        'cdn://room-media/12345/some-image.jpg'
      ]);
    });
  });
});
