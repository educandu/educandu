import AnavisInfo from './anavis-info.js';
import { SOURCE_TYPE } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('anavis-info', () => {
  let sut;
  beforeEach(() => {
    sut = new AnavisInfo(new GithubFlavoredMarkdown());
  });

  describe('getCdnResources', () => {
    it('returns empty list if there is no media specified', () => {
      const result = sut.getCdnResources({ media: null });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for a YouTube resource', () => {
      const result = sut.getCdnResources({ media: { sourceType: SOURCE_TYPE.youtube, souceUrl: 'https://youtube.com/something', text: '' } });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ media: { sourceType: SOURCE_TYPE.external, souceUrl: 'https://someplace.com/sound.mp3', text: '' } });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ media: { sourceType: SOURCE_TYPE.external, souceUrl: null, text: '' } });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ media: { sourceType: SOURCE_TYPE.internal, souceUrl: 'media/some-sound.mp3', text: '' } });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
    it('collects CDN resources from the text markdown', () => {
      const result = sut.getCdnResources({ media: { sourceType: SOURCE_TYPE.external, souceUrl: null, text: '[Hyperlink](cdn://media/my-file.pdf)' } });
      expect(result).toEqual(['media/my-file.pdf']);
    });
  });
});
