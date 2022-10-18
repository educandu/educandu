import AudioWaveformInfo from './audio-waveform-info.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';

describe('audio-waveform-info', () => {
  let sut;
  beforeEach(() => {
    sut = new AudioWaveformInfo();
  });

  describe('redactContent', () => {
    it('redacts inaccessible recources', () => {
      const result = sut.redactContent({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      }, '67890');
      expect(result).toStrictEqual({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: '',
        width: 100
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      }, '12345');
      expect(result).toStrictEqual({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.external,
        sourceUrl: 'https://someplace.com/image.png',
        width: 100
      });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: '',
        width: 100
      });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: 'media/some-image.png',
        width: 100
      });
      expect(result).toEqual(['media/some-image.png']);
    });
  });
});
