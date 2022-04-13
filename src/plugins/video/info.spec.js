import VideoInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('video-info', () => {
  let sut;
  beforeEach(() => {
    sut = new VideoInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the text', () => {
      const input = {
        sourceType: SOURCE_TYPE.external,
        sourceUrl: '',
        posterImage: {},
        text: '[Click me](cdn://rooms/12345/media/my-file.pdf)'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.text).toBe('[Click me]()');
    });

    it('redacts the video source url', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        posterImage: {},
        text: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the video source url', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        posterImage: {},
        text: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the poster image url', () => {
      const input = {
        sourceType: SOURCE_TYPE.external,
        sourceUrl: 'https://somewhere-over-the-rainbow.com/my-video.mp4',
        posterImage: {
          sourceType: SOURCE_TYPE.internal,
          sourceUrl: 'rooms/12345/media/my-image.jpg'
        },
        text: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.posterImage.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/my-video.mp4',
        posterImage: {
          sourceType: SOURCE_TYPE.internal,
          sourceUrl: 'rooms/12345/media/my-image.jpg'
        },
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
        posterImage: {},
        text: 'This [hyperlink](cdn://media/my-file.pdf) and [another one](https://google.com)'
      });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });

    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.youtube,
        sourceUrl: 'https://youtube.com/something',
        posterImage: {},
        text: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/video.mp4',
        posterImage: {},
        text: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: null,
        posterImage: {},
        text: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video.mp4',
        posterImage: {},
        text: ''
      });
      expect(result).toEqual(['media/some-video.mp4']);
    });

    it('returns a list with the url for an internal resource with an internal poster image resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video.mp4',
        posterImage: {
          sourceType: SOURCE_TYPE.internal,
          sourceUrl: 'media/some-image.jpeg'
        },
        text: ''
      });
      expect(result).toEqual(['media/some-video.mp4', 'media/some-image.jpeg']);
    });
  });
});
