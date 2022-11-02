import ImageInfo from './image-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('image-info', () => {
  let sut;
  beforeEach(() => {
    sut = new ImageInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible resources', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        hoverEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/hover-effect-doc.pdf)' },
        revealEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/reveal-effect-doc.pdf)' }
      }, '67890');
      expect(result).toStrictEqual({
        sourceUrl: '',
        copyrightNotice: '[Click here]()',
        hoverEffect: { copyrightNotice: '[Click here]()' },
        revealEffect: { copyrightNotice: '[Click here]()' }
      });
    });
    it('leaves accessible resources intact', () => {
      const result = sut.redactContent({
        sourceUrl: 'cdn://rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        hoverEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/hover-effect-doc.pdf)' },
        revealEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/reveal-effect-doc.pdf)' }
      }, '12345');
      expect(result).toStrictEqual({
        sourceUrl: 'cdn://rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        hoverEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/hover-effect-doc.pdf)' },
        revealEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/reveal-effect-doc.pdf)' }
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from all the copyrightNotice props', () => {
      const result = sut.getCdnResources({
        sourceUrl: null,
        copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)',
        hoverEffect: { copyrightNotice: '[Hyperlink](cdn://media/my-hover-file.pdf)' },
        revealEffect: { copyrightNotice: '[Hyperlink](cdn://media/my-reveal-file.pdf)' }
      });
      expect(result).toStrictEqual([
        'cdn://media/my-file.pdf',
        'cdn://media/my-hover-file.pdf',
        'cdn://media/my-reveal-file.pdf'
      ]);
    });

    it('returns empty list for external resources', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'https://someplace.com/image.png',
        hoverEffect: { sourceUrl: 'https://someplace.com/hover-image.png' },
        revealEffect: { sourceUrl: 'https://someplace.com/reveal-image.png' }
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for resource without url', () => {
      const result = sut.getCdnResources({
        sourceUrl: null,
        hoverEffect: { sourceUrl: null },
        revealEffect: { sourceUrl: null }
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the urls for internal resources', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'cdn://media/some-image.png',
        hoverEffect: { sourceUrl: 'cdn://media/some-hover-image.png' },
        revealEffect: { sourceUrl: 'cdn://media/some-reveal-image.png' }
      });
      expect(result).toEqual([
        'cdn://media/some-image.png',
        'cdn://media/some-hover-image.png',
        'cdn://media/some-reveal-image.png'
      ]);
    });
  });
});
