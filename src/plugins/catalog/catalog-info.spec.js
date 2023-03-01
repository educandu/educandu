import CatalogInfo from './catalog-info.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('catalog-info', () => {
  let sut;
  beforeEach(() => {
    sut = new CatalogInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for an image with an external URL', () => {
      const result = sut.getCdnResources({ items: [{ image: { sourceUrl: 'https://someplace.com/image.png' } }] });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an image without url', () => {
      const result = sut.getCdnResources({ items: [{ image: { sourceUrl: null } }] });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an image with an internal URL', () => {
      const result = sut.getCdnResources({ items: [{ image: { sourceUrl: 'cdn://media-library/some-image.png' } }] });
      expect(result).toEqual(['cdn://media-library/some-image.png']);
    });

    it('returns a list with all internal URLs', () => {
      const result = sut.getCdnResources({
        items: [
          { image: { sourceUrl: 'cdn://media-library/some-image-1.png' } },
          { image: { sourceUrl: 'cdn://room-media/12345/some-image-2.png' } },
          { image: { sourceUrl: 'https://someplace.com/some-image-3.png' } },
          { image: { sourceUrl: 'cdn://media-library/some-image-4.png' } },
          { image: { sourceUrl: 'cdn://room-media/12345/some-image-5.png' } }
        ]
      });
      expect(result).toEqual([
        'cdn://media-library/some-image-1.png',
        'cdn://room-media/12345/some-image-2.png',
        'cdn://media-library/some-image-4.png',
        'cdn://room-media/12345/some-image-5.png'
      ]);
    });
  });
});
