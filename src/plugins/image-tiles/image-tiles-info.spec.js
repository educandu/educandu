import ImageTilesInfo from './image-tiles-info.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';

describe('image-tiles-info', () => {
  let sut;
  beforeEach(() => {
    sut = new ImageTilesInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list if there is no image specified', () => {
      const result = sut.getCdnResources({ tiles: [{ image: null }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ tiles: [{ image: { sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/image.png' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ tiles: [{ image: { sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: null } }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ tiles: [{ image: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'media/some-image.png' } }] });
      expect(result).toEqual(['media/some-image.png']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tiles: [
          { image: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'media/some-image-1.png' } },
          { image: { sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/some-image-2.png' } },
          { image: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'media/some-image-3.png' } }
        ]
      });
      expect(result).toEqual(['media/some-image-1.png', 'media/some-image-3.png']);
    });
  });
});
