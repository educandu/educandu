import sut from './info.js';
import { MEDIA_TYPE } from './constants.js';

describe('anavis-info', () => {
  describe('getCdnResources', () => {
    it('returns empty list if there is no media specified', () => {
      const result = sut.getCdnResources({ media: null });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.youtube, url: 'https://youtube.com/something' } });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.external, url: 'https://someplace.com/sound.mp3' } });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.external, url: null } });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.internal, url: 'media/some-sound.mp3' } });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
  });
});
