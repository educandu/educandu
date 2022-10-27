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
        tests: [
          { sound: { useMidi: false, sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://rooms/12345/media/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://rooms/12345/media/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '67890');
      expect(result).toStrictEqual({
        title: '[Click here]()',
        tests: [
          { sound: { useMidi: false, sourceUrl: '', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: '', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: '', copyrightNotice: '' } }
        ]
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [
          { sound: { useMidi: false, sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://rooms/12345/media/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://rooms/12345/media/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '12345');
      expect(result).toStrictEqual({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [
          { sound: { useMidi: false, sourceUrl: 'cdn://rooms/12345/media/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://rooms/12345/media/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://rooms/12345/media/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the title markdown', () => {
      const result = sut.getCdnResources({ title: '[Hyperlink](cdn://media/my-file.pdf)', tests: [] });
      expect(result).toStrictEqual(['cdn://media/my-file.pdf']);
    });
    it('returns resources from the sound copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' }, questionImage: {}, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://media/my-file.pdf']);
    });
    it('returns resources from the questionImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: {}, questionImage: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' }, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://media/my-file.pdf']);
    });
    it('returns resources from the answerImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: {}, questionImage: {}, answerImage: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' } }] });
      expect(result).toStrictEqual(['cdn://media/my-file.pdf']);
    });
    it('returns empty list for a MIDI resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { useMidi: true, copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { useMidi: false, sourceUrl: 'https://someplace.com/sound.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { useMidi: false, sourceUrl: null, copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { useMidi: false, sourceUrl: 'cdn://media/some-sound.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://media/some-sound.mp3']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tests: [
          { sound: { useMidi: false, sourceUrl: 'cdn://media/some-sound-1.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} },
          { sound: { useMidi: false, sourceUrl: 'https://someplace.com/some-sound-2.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} },
          { sound: { useMidi: false, sourceUrl: 'cdn://media/some-sound-3.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }
        ]
      });
      expect(result).toEqual(['cdn://media/some-sound-1.mp3', 'cdn://media/some-sound-3.mp3']);
    });
  });
});
