import AnavisInfo from './anavis-info.js';
import { MEDIA_TYPE } from './constants.js';
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
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.youtube, url: 'https://youtube.com/something', text: '' } });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.external, url: 'https://someplace.com/sound.mp3', text: '' } });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.external, url: null, text: '' } });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.internal, url: 'media/some-sound.mp3', text: '' } });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
    it('collects CDN resources from the text markdown', () => {
      const result = sut.getCdnResources({ media: { type: MEDIA_TYPE.external, url: null, text: '[Hyperlink](cdn://media/my-file.pdf)' } });
      expect(result).toEqual(['media/my-file.pdf']);
    });
  });
});
