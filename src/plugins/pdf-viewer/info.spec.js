import PdfViewerInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';

describe('pdf-viewer-info', () => {
  let sut;
  beforeEach(() => {
    sut = new PdfViewerInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-doc.pdf' });
      expect(result).toEqual(['media/some-doc.pdf']);
    });
  });
});
