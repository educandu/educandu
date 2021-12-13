import ImageInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';

describe('image-info', () => {
  let sut;
  beforeEach(() => {
    sut = new ImageInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/image.png' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-image.png' });
      expect(result).toEqual(['media/some-image.png']);
    });
    it('returns a list with the url for an internal resource in the effect', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/image.png',
        effect: {
          sourceType: SOURCE_TYPE.internal,
          sourceUrl: 'media/some-image.png'
        }
      });
      expect(result).toEqual(['media/some-image.png']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: 'media/some-image-1.png',
        effect: {
          sourceType: SOURCE_TYPE.internal,
          sourceUrl: 'media/some-image-2.png'
        }
      });
      expect(result).toEqual(['media/some-image-1.png', 'media/some-image-2.png']);
    });
  });
});
