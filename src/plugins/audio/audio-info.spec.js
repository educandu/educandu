import AudioInfo from './audio-info.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('audio-info', () => {
  let sut;
  beforeEach(() => {
    sut = new AudioInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible recources', () => {
      const result = sut.redactContent({
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      }, '67890');
      expect(result).toStrictEqual({
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: '',
        copyrightNotice: '[Click here]()'
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      }, '12345');
      expect(result).toStrictEqual({
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-sound.mp3',
        copyrightNotice: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the copyrightNotice', () => {
      const result = sut.getCdnResources({ sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: null, copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ sourceType: MEDIA_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/sound.mp3', copyrightNotice: '' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ sourceType: MEDIA_SOURCE_TYPE.internal, sourceUrl: null, copyrightNotice: '' });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ sourceType: MEDIA_SOURCE_TYPE.internal, sourceUrl: 'media/some-sound.mp3', copyrightNotice: '' });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
  });
});
