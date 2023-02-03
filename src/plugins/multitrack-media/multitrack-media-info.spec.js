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
          copyrightNotice: `[Click me](cdn://room-media/${currentRoomId}/my-file-1.pdf)`,
          posterImage: {
            sourceUrl: ''
          }
        },
        secondaryTracks: [
          {
            copyrightNotice: `[Click me too](cdn://room-media/${currentRoomId}/my-file-2.pdf)`
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
          sourceUrl: `cdn://room-media/${currentRoomId}/my-video-1.mp4`,
          copyrightNotice: '',
          posterImage: {
            sourceUrl: ''
          }
        },
        secondaryTracks: [
          {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-video-2.mp4`,
            copyrightNotice: ''
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.mainTrack.sourceUrl).toBe('');
      expect(result.secondaryTracks[0].sourceUrl).toBe('');
    });

    it('redacts the poster image source url', () => {
      content = {
        mainTrack: {
          sourceUrl: '',
          copyrightNotice: '',
          posterImage: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-image.jpg`
          }
        },
        secondaryTracks: [
          {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-video-2.mp4`,
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
          sourceUrl: `cdn://room-media/${currentRoomId}/my-file-1.pdf`,
          copyrightNotice: '',
          posterImage: {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-image.jpg`
          }
        },
        secondaryTracks: [
          {
            sourceUrl: `cdn://room-media/${currentRoomId}/my-file-2.pdf`,
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
          copyrightNotice: 'This [hyperlink](cdn://document-media/my-file-1.pdf) and [another one](https://google.com)',
          posterImage: {
            sourceUrl: ''
          }
        },
        secondaryTracks: [
          {
            sourceUrl: '',
            copyrightNotice: 'This [hyperlink](cdn://document-media/my-file-2.pdf) and [another one](https://google.com)'
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual([
        'cdn://document-media/my-file-1.pdf',
        'cdn://document-media/my-file-2.pdf'
      ]);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        mainTrack: {
          sourceUrl: 'https://youtube.com/something',
          copyrightNotice: '',
          posterImage: {
            sourceUrl: ''
          }
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
          copyrightNotice: '',
          posterImage: {
            sourceUrl: 'https://someplace.com/image.jpg'
          }
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
          copyrightNotice: '',
          posterImage: {
            sourceUrl: ''
          }
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
          sourceUrl: 'cdn://document-media/12345/some-video-1.mp4',
          copyrightNotice: '',
          posterImage: {
            sourceUrl: 'cdn://document-media/12345/some-image.jpg'
          }
        },
        secondaryTracks: [
          {
            sourceUrl: 'cdn://document-media/12345/some-video-2.mp4',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://document-media/12345/some-video-1.mp4',
        'cdn://document-media/12345/some-image.jpg',
        'cdn://document-media/12345/some-video-2.mp4'
      ]);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      content = {
        mainTrack: {
          sourceUrl: 'cdn://room-media/12345/some-video-1.mp4',
          copyrightNotice: '',
          posterImage: {
            sourceUrl: 'cdn://room-media/12345/some-image.jpg'
          }
        },
        secondaryTracks: [
          {
            sourceUrl: 'cdn://room-media/12345/some-video-2.mp4',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual([
        'cdn://room-media/12345/some-video-1.mp4',
        'cdn://room-media/12345/some-image.jpg',
        'cdn://room-media/12345/some-video-2.mp4'
      ]);
    });
  });
});
