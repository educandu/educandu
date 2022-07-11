import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('interactive-media-info', () => {
  let sut;
  beforeEach(() => {
    sut = new InteractiveMediaInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the copyrightNotice', () => {
      const input = {
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: '',
        copyrightNotice: '[Click me](cdn://rooms/12345/media/my-file.pdf)'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.copyrightNotice).toBe('[Click me]()');
    });

    it('redacts the media source url', () => {
      const input = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        copyrightNotice: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the media source url', () => {
      const input = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        copyrightNotice: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        copyrightNotice: '[Click me](cdn://rooms/12345/media/my-file.pdf)'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from copyrightNotice', () => {
      const result = sut.getCdnResources({
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: '',
        copyrightNotice: 'This [hyperlink](cdn://media/my-file.pdf) and [another one](https://google.com)'
      });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({
        sourceType: MEDIA_SOURCE_TYPE.youtube,
        sourceUrl: 'https://youtube.com/something',
        copyrightNotice: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceType: MEDIA_SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/video.mp4',
        copyrightNotice: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: null,
        copyrightNotice: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video.mp4',
        copyrightNotice: ''
      });
      expect(result).toEqual(['media/some-video.mp4']);
    });
  });
});
