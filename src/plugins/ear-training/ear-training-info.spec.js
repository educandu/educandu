import { SOUND_SOURCE_TYPE } from './constants.js';
import EarTrainingInfo from './ear-training-info.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
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
          { sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-sound.mp3', copyrightNotice: '' } },
          { questionImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-image.jpeg', copyrightNotice: '' } },
          { answerImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '67890');
      expect(result).toStrictEqual({
        title: '[Click here]()',
        tests: [
          { sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: '', copyrightNotice: '' } },
          { questionImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: '', copyrightNotice: '' } },
          { answerImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: '', copyrightNotice: '' } }
        ]
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [
          { sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-sound.mp3', copyrightNotice: '' } },
          { questionImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-image.jpeg', copyrightNotice: '' } },
          { answerImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '12345');
      expect(result).toStrictEqual({
        title: '[Click here](cdn://rooms/12345/media/some-doc.pdf)',
        tests: [
          { sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-sound.mp3', copyrightNotice: '' } },
          { questionImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-image.jpeg', copyrightNotice: '' } },
          { answerImage: { sourceType: IMAGE_SOURCE_TYPE.internal, sourceUrl: 'rooms/12345/media/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the title markdown', () => {
      const result = sut.getCdnResources({ title: '[Hyperlink](cdn://media/my-file.pdf)', tests: [] });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns resources from the sound copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' } }] });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns resources from the questionImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ questionImage: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' } }] });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns resources from the answerImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ answerImage: { copyrightNotice: '[Hyperlink](cdn://media/my-file.pdf)' } }] });
      expect(result).toStrictEqual(['media/my-file.pdf']);
    });
    it('returns empty list if there is no sound, questionImage or questionAnswer specified', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: null, questionImage: null, questionAnswer: null }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for a MIDI resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOUND_SOURCE_TYPE.midi, copyrightNotice: '' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOUND_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/sound.mp3', copyrightNotice: '' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOUND_SOURCE_TYPE.external, sourceUrl: null, copyrightNotice: '' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: 'media/some-sound.mp3', copyrightNotice: '' } }] });
      expect(result).toStrictEqual(['media/some-sound.mp3']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tests: [
          { sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: 'media/some-sound-1.mp3', copyrightNotice: '' } },
          { sound: { sourceType: SOUND_SOURCE_TYPE.external, sourceUrl: 'https://someplace.com/some-sound-2.mp3', copyrightNotice: '' } },
          { sound: { sourceType: SOUND_SOURCE_TYPE.internal, sourceUrl: 'media/some-sound-3.mp3' }, copyrightNotice: '' }
        ]
      });
      expect(result).toEqual(['media/some-sound-1.mp3', 'media/some-sound-3.mp3']);
    });
  });
});
