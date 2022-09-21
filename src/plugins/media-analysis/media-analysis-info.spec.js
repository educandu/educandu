import MediaAnalysisInfo from './media-analysis-info.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
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
          sourceType: MEDIA_SOURCE_TYPE.internal,
          sourceUrl: `rooms/${currentRoomId}/media/my-video-1.mp4`,
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.internal,
            sourceUrl: `rooms/${currentRoomId}/media/my-video-2.mp4`,
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
          sourceType: MEDIA_SOURCE_TYPE.internal,
          sourceUrl: `rooms/${currentRoomId}/media/my-file-1.pdf`,
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.internal,
            sourceUrl: `rooms/${currentRoomId}/media/my-file-2.pdf`,
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
          sourceType: MEDIA_SOURCE_TYPE.external,
          sourceUrl: '',
          copyrightNotice: 'This [hyperlink](cdn://media/my-file-1.pdf) and [another one](https://google.com)'
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.external,
            sourceUrl: '',
            copyrightNotice: 'This [hyperlink](cdn://media/my-file-2.pdf) and [another one](https://google.com)'
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual(['media/my-file-1.pdf', 'media/my-file-2.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        mainTrack: {
          sourceType: MEDIA_SOURCE_TYPE.youtube,
          sourceUrl: 'https://youtube.com/something',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.youtube,
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
          sourceType: MEDIA_SOURCE_TYPE.external,
          sourceUrl: 'https://someplace.com/video.mp4',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.external,
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
          sourceType: MEDIA_SOURCE_TYPE.internal,
          sourceUrl: null,
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.internal,
            sourceUrl: null,
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      content = {
        mainTrack: {
          sourceType: MEDIA_SOURCE_TYPE.internal,
          sourceUrl: 'media/some-video-1.mp4',
          copyrightNotice: ''
        },
        secondaryTracks: [
          {
            sourceType: MEDIA_SOURCE_TYPE.internal,
            sourceUrl: 'media/some-video-2.mp4',
            copyrightNotice: ''
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual(['media/some-video-1.mp4', 'media/some-video-2.mp4']);
    });
  });
});
