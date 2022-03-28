import VideoInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';

describe('video-info', () => {
  let sut;
  beforeEach(() => {
    sut = new VideoInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.youtube, sourceUrl: 'https://youtube.com/something' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/video.mp4' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-video.mp4' });
      expect(result).toEqual(['media/some-video.mp4']);
    });
  });
});
