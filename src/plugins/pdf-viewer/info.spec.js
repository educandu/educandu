import PdfViewerInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';

describe('pdf-viewer-info', () => {
  let sut;
  beforeEach(() => {
    sut = new PdfViewerInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.external, url: 'https://someplace.com/doc.pdf' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.internal, url: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.internal, url: 'media/some-doc.pdf' });
      expect(result).toEqual(['media/some-doc.pdf']);
    });
  });
});
