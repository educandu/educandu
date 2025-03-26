import PdfViewerInfo from './pdf-viewer-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('pdf-viewer-info', () => {
  let sut;
  beforeEach(() => {
    sut = new PdfViewerInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts the PDF source url', () => {
      const input = {
        sourceUrl: 'cdn://room-media/12345/my-document.pdf',
        caption: ''
      };
      const result = sut.redactContent(input, '67890');
      expect(result.sourceUrl).toBe('');
    });

    it('redacts the caption', () => {
      const input = {
        sourceUrl: '',
        caption: 'This [hyperlink](cdn://room-media/12345/my-file.pdf) and [another one](https://google.com)'
      };
      const result = sut.redactContent(input, '67890');
      expect(result.caption).toBe('This [hyperlink]() and [another one](https://google.com)');
    });

    it('leaves accessible paths intact', () => {
      const input = {
        sourceUrl: 'cdn://room-media/12345/my-document.pdf',
        caption: 'This [hyperlink](cdn://room-media/12345/my-file.pdf) and [another one](https://google.com)'
      };
      const result = sut.redactContent(input, '12345');
      expect(result).toStrictEqual(input);
    });
  });

  describe('getCdnResources', () => {
    it('returns a list of resources from within the caption', () => {
      const result = sut.getCdnResources({
        sourceUrl: null,
        caption: 'This [hyperlink](cdn://room-media/12345/my-file.pdf) and [another one](https://google.com)'
      });
      expect(result).toEqual([
        'cdn://room-media/12345/my-file.pdf'
      ]);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceUrl: null,
        caption: ''
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the url for an internal public resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'cdn://media-library/some-doc.pdf',
        caption: ''
      });
      expect(result).toEqual(['cdn://media-library/some-doc.pdf']);
    });

    it('returns a list with the url for an internal room-media resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'cdn://room-media/12345/some-doc.pdf',
        caption: ''
      });
      expect(result).toEqual(['cdn://room-media/12345/some-doc.pdf']);
    });
  });
});
