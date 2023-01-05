import { beforeEach, describe, expect, it } from 'vitest';
import MultitrackMediaInfo from './multitrack-media-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('multitrack-media-info', () => {
  let sut;
  let result;
  let content;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new MultitrackMediaInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      content = {
        mainTrack: {
          copyrightNotice: `[Click me](cdn://rooms/${currentRoomId}/media/my-file-1.pdf)`
        },
        secondaryTracks: [
          {
            copyrightNotice: `[Click me too](cdn://rooms/${currentRoomId}/media/my-file-2.pdf)`
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.mainTrack.copyrightNotice).toBe('[Click me]()');
      expect(result.secondaryTracks[0].copyrightNotice).toBe('[Click me too]()');
    });

    it('redacts the media source url', () => {
      content = {
        mainTrack: {
          sourceUrl: `cdn://rooms/${currentRoomId}/media/my-video-1.mp4`,
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: `cdn://rooms/${currentRoomId}/media/my-video-2.mp4`,
            copyrightNotice: ''
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.mainTrack.sourceUrl).toBe('');
      expect(result.secondaryTracks[0].sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        mainTrack: {
          sourceUrl: `cdn://rooms/${currentRoomId}/media/my-file-1.pdf`,
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: `cdn://rooms/${currentRoomId}/media/my-file-2.pdf`,
            copyrightNotice: ''
          }
        ]
      };
      result = sut.redactContent(content, currentRoomId);
      expect(result).toStrictEqual(content);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from copyrightNotice', () => {
      content = {
        mainTrack: {
          sourceUrl: '',
          copyrightNotice: 'This [hyperlink](cdn://media/my-file-1.pdf) and [another one](https://google.com)'
        },
        secondaryTracks: [
          {
            sourceUrl: '',
            copyrightNotice: 'This [hyperlink](cdn://media/my-file-2.pdf) and [another one](https://google.com)'
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual([
        'cdn://media/my-file-1.pdf',
        'cdn://media/my-file-2.pdf'
      ]);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        mainTrack: {
          sourceUrl: 'https://youtube.com/something',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: 'https://youtube.com/something',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        mainTrack: {
          sourceUrl: 'https://someplace.com/video.mp4',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: 'https://someplace.com/video.mp4',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        mainTrack: {
          sourceUrl: null,
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: null,
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      content = {
        mainTrack: {
          sourceUrl: 'cdn://media/12345/some-video-1.mp4',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: 'cdn://media/12345/some-video-2.mp4',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://media/12345/some-video-1.mp4',
        'cdn://media/12345/some-video-2.mp4'
      ]);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      content = {
        mainTrack: {
          sourceUrl: 'cdn://rooms/12345/media/some-video-1.mp4',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceUrl: 'cdn://rooms/12345/media/some-video-2.mp4',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://rooms/12345/media/some-video-1.mp4',
        'cdn://rooms/12345/media/some-video-2.mp4'
      ]);
    });
  });
});
