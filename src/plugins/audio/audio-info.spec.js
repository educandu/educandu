import AudioInfo from './audio-info.js';
import { SOURCE_TYPE } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('audio-info', () => {
  let sut;
  beforeEach(() => {
    sut = new AudioInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible recources', () => {
      const result = sut.redactContent({
        type: SOURCE_TYPE.internal,
        url: 'rooms/12345/media/some-sound.mp3',
        text: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      }, '67890');
      expect(result).toStrictEqual({
        type: SOURCE_TYPE.internal,
        url: '',
        text: '[Click here]()'
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        type: SOURCE_TYPE.internal,
        url: 'rooms/12345/media/some-sound.mp3',
        text: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      }, '12345');
      expect(result).toStrictEqual({
        type: SOURCE_TYPE.internal,
        url: 'rooms/12345/media/some-sound.mp3',
        text: '[Click here](cdn://rooms/12345/media/some-doc.pdf)'
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the text', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.external, url: null, text: '[Hyperlink](cdn://media/my-file.pdf)' });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.external, url: 'https://someplace.com/sound.mp3', text: '' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.internal, url: null, text: '' });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.internal, url: 'media/some-sound.mp3', text: '' });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
  });
});
