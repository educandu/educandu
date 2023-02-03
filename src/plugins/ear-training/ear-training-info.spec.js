import EarTrainingInfo from './ear-training-info.js';
import { beforeEach, describe, expect, it } from 'vitest';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

describe('ear-training-info', () => {
  let sut;
  beforeEach(() => {
    sut = new EarTrainingInfo(new GithubFlavoredMarkdown());
  });

  describe('redactContent', () => {
    it('redacts inaccessible resources', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://room-media/12345/some-doc.pdf)',
        tests: [
          { sound: { sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://room-media/12345/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://room-media/12345/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '67890');
      expect(result).toStrictEqual({
        title: '[Click here]()',
        tests: [
          { sound: { sourceUrl: '', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: '', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: '', copyrightNotice: '' } }
        ]
      });
    });
    it('leaves accessible resources intact', () => {
      const result = sut.redactContent({
        title: '[Click here](cdn://room-media/12345/some-doc.pdf)',
        tests: [
          { sound: { sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://room-media/12345/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://room-media/12345/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      }, '12345');
      expect(result).toStrictEqual({
        title: '[Click here](cdn://room-media/12345/some-doc.pdf)',
        tests: [
          { sound: { sourceUrl: 'cdn://room-media/12345/some-sound.mp3', copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { sourceUrl: 'cdn://room-media/12345/some-image.jpeg', copyrightNotice: '' }, answerImage: { copyrightNotice: '' } },
          { sound: { copyrightNotice: '' }, questionImage: { copyrightNotice: '' }, answerImage: { sourceUrl: 'cdn://room-media/12345/some-other-image.jpeg', copyrightNotice: '' } }
        ]
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns resources from the title markdown', () => {
      const result = sut.getCdnResources({ title: '[Hyperlink](cdn://document-media/my-file.pdf)', tests: [] });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });
    it('returns resources from the sound copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { copyrightNotice: '[Hyperlink](cdn://document-media/my-file.pdf)' }, questionImage: {}, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });
    it('returns resources from the questionImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: {}, questionImage: { copyrightNotice: '[Hyperlink](cdn://document-media/my-file.pdf)' }, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });
    it('returns resources from the answerImage copyrightNotice', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: {}, questionImage: {}, answerImage: { copyrightNotice: '[Hyperlink](cdn://document-media/my-file.pdf)' } }] });
      expect(result).toStrictEqual(['cdn://document-media/my-file.pdf']);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceUrl: 'https://someplace.com/sound.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceUrl: null, copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ title: '', tests: [{ sound: { sourceUrl: 'cdn://document-media/some-sound.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }] });
      expect(result).toStrictEqual(['cdn://document-media/some-sound.mp3']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tests: [
          { sound: { sourceUrl: 'cdn://document-media/some-sound-1.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} },
          { sound: { sourceUrl: 'https://someplace.com/some-sound-2.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} },
          { sound: { sourceUrl: 'cdn://document-media/some-sound-3.mp3', copyrightNotice: '' }, questionImage: {}, answerImage: {} }
        ]
      });
      expect(result).toEqual(['cdn://document-media/some-sound-1.mp3', 'cdn://document-media/some-sound-3.mp3']);
    });
  });
});
