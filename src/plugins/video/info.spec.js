import VideoInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';

describe('video-info', () => {
  let sut;
  beforeEach(() => {
    sut = new VideoInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.youtube,
        sourceUrl: 'https://youtube.com/something',
        posterImage: {}
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/video.mp4',
        posterImage: {}
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: null,
        posterImage: {}
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'media/some-video.mp4',
        posterImage: {}
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
        }
      });
      expect(result).toEqual(['media/some-video.mp4', 'media/some-image.jpeg']);
    });
  });
});
