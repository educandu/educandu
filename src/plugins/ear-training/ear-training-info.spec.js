import { SOURCE_TYPE } from './constants.js';
import EarTrainingInfo from './ear-training-info.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('ear-training-info', () => {
  let sut;
  beforeEach(() => {
    sut = new EarTrainingInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible recources', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [{ sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-sound.mp3', text: '' } }]
      }, '67890');
      expect(result).toStrictEqual({
        title: '[Click here]()',
        tests: [{ sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: '', text: '' } }]
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [{ sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-sound.mp3', text: '' } }]
      }, '12345');
      expect(result).toStrictEqual({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [{ sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-sound.mp3', text: '' } }]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the title markdown', () => {
      const result = sut.getCdnResources({ title: '[Hyperlink](cdn://media/my-file.pdf)', tests: [] });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns resources from the sound text', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: SOURCE_TYPE.midi, text: '[Hyperlink](cdn://media/my-file.pdf)' }] });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns empty list if there is no sound specified', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: null }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for a MIDI resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOURCE_TYPE.midi, text: '' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/sound.mp3', text: '' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOURCE_TYPE.external, sourceUrl: null, text: '' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-sound.mp3', text: '' } }] });
      expect(result).toStrictEqual(['media/some-sound.mp3']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tests: [
          { sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-sound-1.mp3', text: '' } },
          { sound: { sourceType: SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/some-sound-2.mp3', text: '' } },
          { sound: { sourceType: SOURCE_TYPE.internal, sourceUrl: 'media/some-sound-3.mp3' }, text: '' }
        ]
      });
      expect(result).toEqual(['media/some-sound-1.mp3', 'media/some-sound-3.mp3']);
    });
  });
});
