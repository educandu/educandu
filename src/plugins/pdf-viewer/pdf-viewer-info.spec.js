import PdfViewerInfo from './pdf-viewer-info.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('pdf-viewer-info', () => {
  let sut;
  beforeEach(() => {
    sut = new PdfViewerInfo();
  });

  describe('redactContent', () => {
    it('redacts the PDF source url', () => {
      const input = {
        sourceUrl: 'cdn://rooms/12345/media/my-document.pdf'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceUrl: 'cdn://rooms/12345/media/my-document.pdf'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceUrl: null });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://media/12345/some-doc.pdf' });
      expect(result).toEqual(['cdn://media/12345/some-doc.pdf']);
    });

    it('returns a list with the url for an internal private resource', () => {
      const result = sut.getCdnResources({ sourceUrl: 'cdn://rooms/12345/media/some-doc.pdf' });
      expect(result).toEqual(['cdn://rooms/12345/media/some-doc.pdf']);
    });
  });
});
