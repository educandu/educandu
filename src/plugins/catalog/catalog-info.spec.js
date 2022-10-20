import CatalogInfo from './catalog-info.js';

describe('catalog-info', () => {
  let sut;
  beforeEach(() => {
    sut = new CatalogInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ items: [{ image: { sourceUrl: 'https://someplace.com/image.png' } }] });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ items: [{ image: { sourceUrl: null } }] });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ items: [{ image: { sourceUrl: 'media/some-image.png' } }] });
      expect(result).toEqual(['media/some-image.png']);
    });

    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        items: [
          { image: { sourceUrl: 'media/12345/some-image-1.png' } },
          { image: { sourceUrl: 'rooms/12345/media/some-image-2.png' } },
          { image: { sourceUrl: 'https://someplace.com/some-image-3.png' } },
          { image: { sourceUrl: 'media/12345/some-image-4.png' } },
          { image: { sourceUrl: 'rooms/12345/media/some-image-5.png' } }
        ]
      });
      expect(result).toEqual([
        'media/12345/some-image-1.png',
        'rooms/12345/media/some-image-2.png',
        'media/12345/some-image-4.png',
        'rooms/12345/media/some-image-5.png'
      ]);
    });
  });
});
