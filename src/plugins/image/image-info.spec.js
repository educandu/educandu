import ImageInfo from './image-info.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('image-info', () => {
  let sut;
  beforeEach(() => {
    sut = new ImageInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible recources', () => {
      const result = sut.redactContent({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        hoverEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/hover-effect-doc.pdf)' },
        revealEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/reveal-effect-doc.pdf)' }
      }, '67890');
      expect(result).toStrictEqual({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: '',
        copyrightNotice: '[Click here]()',
        hoverEffect: { copyrightNotice: '[Click here]()' },
        revealEffect: { copyrightNotice: '[Click here]()' }
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        hoverEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/hover-effect-doc.pdf)' },
        revealEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/reveal-effect-doc.pdf)' }
      }, '12345');
      expect(result).toStrictEqual({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        hoverEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/hover-effect-doc.pdf)' },
        revealEffect: { copyrightNotice: '[Click here](cdn://rooms/12345/media/reveal-effect-doc.pdf)' }
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from all the copyrightNotice props', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.external,
        sourceUrl: null,
        copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)',
        hoverEffect: { copyrightNotice: '[Hyperlink](cdn://media/my-hover-file.pdf)' },
        revealEffect: { copyrightNotice: '[Hyperlink](cdn://media/my-reveal-file.pdf)' }
      });
      expect(result).toStrictEqual(['media/my-file.pdf', 'media/my-hover-file.pdf', 'media/my-reveal-file.pdf']);
    });

    it('returns empty list for external resources', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/image.png',
        hoverEffect: { sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/hover-image.png' },
        revealEffect: { sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/reveal-image.png' }
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: null,
        hoverEffect: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: null },
        revealEffect: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: null }
      });
      expect(result).toHaveLength(0);
    });

    it('returns a list with the urls for internal resources', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'media/some-image.png',
        hoverEffect: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'media/some-hover-image.png' },
        revealEffect: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'media/some-reveal-image.png' }
      });
      expect(result).toEqual(['media/some-image.png', 'media/some-hover-image.png', 'media/some-reveal-image.png']);
    });
  });
});
