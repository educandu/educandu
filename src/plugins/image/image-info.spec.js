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
        effect: {
          copyrightNotice: '[Click here](cdn://rooms/12345/media/some-effect-doc.pdf)'
        }
      }, '67890');
      expect(result).toStrictEqual({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: '',
        copyrightNotice: '[Click here]()',
        effect: {
          copyrightNotice: '[Click here]()'
        }
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        effect: {
          copyrightNotice: '[Click here](cdn://rooms/12345/media/some-effect-doc.pdf)'
        }
      }, '12345');
      expect(result).toStrictEqual({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.jpeg',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        effect: {
          copyrightNotice: '[Click here](cdn://rooms/12345/media/some-effect-doc.pdf)'
        }
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the copyrightNotice', () => {
      const result = sut.getCdnResources({ sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: null, copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns resources from the effect copyrightNotice', () => {
      const result = sut.getCdnResources({ sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: null, effect: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' } });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ sourceType: IMAGE_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/image.png' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'media/some-image.png' });
      expect(result).toEqual(['media/some-image.png']);
    });
    it('returns a list with the url for an internal resource in the effect', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/image.png',
        effect: {
          sourceType: IMAGE_SOURCE_TYPE.internal,
          sourceUrl: 'media/some-image.png'
        }
      });
      expect(result).toEqual(['media/some-image.png']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'media/some-image-1.png',
        effect: {
          sourceType: IMAGE_SOURCE_TYPE.internal,
          sourceUrl: 'media/some-image-2.png'
        }
      });
      expect(result).toEqual(['media/some-image-1.png', 'media/some-image-2.png']);
    });
  });
});
