import { SOURCE_TYPE } from './constants.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('interactive-media-info', () => {
  let sut;
  beforeEach(() => {
    sut = new InteractiveMediaInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the text', () => {
      const input = {
        sourceType: SOURCE_TYPE.external,
        sourceUrl: '',
        text: '[Click me](cdn://rooms/12345/media/my-file.pdf)'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.text).toBe('[Click me]()');
    });

    it('redacts the media source url', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        text: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the media source url', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        text: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        text: '[Click me](cdn://rooms/12345/media/my-file.pdf)'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns CDN resources from text', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.external,
        sourceUrl: '',
        text: 'This [hyperlink](cdn://media/my-file.pdf) and [another one](https://google.com)'
      });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.youtube,
        sourceUrl: 'https://youtube.com/something',
        text: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/video.mp4',
        text: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: null,
        text: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video.mp4',
        text: ''
      });
      expect(result).toEqual(['media/some-video.mp4']);
    });
  });
});
