import MediaSlideShowInfo from './media-slideshow-info.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('media-slideshow-info', () => {
  let sut;
  let result;
  let content;

  const otherRoomId = '67890';
  const currentRoomId = '12345';

  beforeEach(() => {
    sut = new MediaSlideShowInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: '',
        copyrightNotice: `[Click me 1](cdn://rooms/${currentRoomId}/media/my-file-1.pdf)`,
        chapters: [
          {
            image: {
              sourceType: MEDIA_SOURCE_TYPE.external,
              sourceUrl: '',
              copyrightNotice: `[Click me 2](cdn://rooms/${currentRoomId}/media/my-file-2.pdf)`
            }
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.copyrightNotice).toBe('[Click me 1]()');
      expect(result.copyrightNotice).toBe('[Click me 2]()');
    });

    it('redacts the media source url', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: `rooms/${currentRoomId}/media/my-video-1.mp4`,
        copyrightNotice: '',
        chapters: [
          {
            image: {
              sourceType: MEDIA_SOURCE_TYPE.internal,
              sourceUrl: `rooms/${currentRoomId}/media/my-video-2.mp4`,
              copyrightNotice: ''
            }
          }
        ]
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: `rooms/${currentRoomId}/media/my-video-1.mp4`,
        copyrightNotice: `[Click me 1](cdn://rooms/${currentRoomId}/media/my-file-1.pdf)`,
        chapters: [
          {
            image: {
              sourceType: MEDIA_SOURCE_TYPE.internal,
              sourceUrl: `rooms/${currentRoomId}/media/my-video-2.mp4`,
              copyrightNotice: `[Click me 2](cdn://rooms/${currentRoomId}/media/my-file-2.pdf)`
            }
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
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: '',
        copyrightNotice: 'This [hyperlink](cdn://media/my-file-1.pdf) and [another one](https://google.com)',
        chapters: [
          {
            image: {
              sourceType: MEDIA_SOURCE_TYPE.external,
              sourceUrl: '',
              copyrightNotice: 'This [hyperlink](cdn://media/my-file-2.pdf) and [another one](https://google.com)'
            }
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual(['media/my-file-1.pdf', 'media/my-file-2.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.youtube,
        sourceUrl: 'https://youtube.com/something-1',
        copyrightNotice: '',
        chapters: [
          {
            image: {
              sourceType: MEDIA_SOURCE_TYPE.youtube,
              sourceUrl: 'https://youtube.com/something-2',
              copyrightNotice: ''
            }
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/video-1.mp4',
        copyrightNotice: '',
        chapters: [
          {
            image: {
              sourceType: MEDIA_SOURCE_TYPE.external,
              sourceUrl: 'https://someplace.com/video-2.mp4',
              copyrightNotice: ''
            }
          }
        ]
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: null,
        copyrightNotice: '',
        chapters: [
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
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video-1.mp4',
        copyrightNotice: '',
        chapters: [
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
