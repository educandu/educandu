import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
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
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: '',
        copyrightNotice: `[Click me](cdn://rooms/${currentRoomId}/media/my-file.pdf)`
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.copyrightNotice).toBe('[Click me]()');
    });

    it('redacts the media source url', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: `rooms/${currentRoomId}/media/my-video.mp4`,
        copyrightNotice: ''
      };
      result = sut.redactContent(content, otherRoomId);
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
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
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: '',
        copyrightNotice: 'This [hyperlink](cdn://media/my-file.pdf) and [another one](https://google.com)'
      };
      result = sut.getCdnResources(content);
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.youtube,
        sourceUrl: 'https://youtube.com/something',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/video.mp4',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: null,
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      content = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video.mp4',
        copyrightNotice: ''
      };
      result = sut.getCdnResources(content);
      expect(result).toEqual(['media/some-video.mp4']);
    });
  });
});
