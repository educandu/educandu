import AudioWaveformInfo from './audio-waveform-info.js';

describe('audio-waveform-info', () => {
  let sut;
  beforeEach(() => {
    sut = new AudioWaveformInfo();
  });

  describe('redactContent', () => {
    it('redacts inaccessible recources', () => {
      const result = sut.redactContent({
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      }, '67890');
      expect(result).toStrictEqual({
        sourceUrl: '',
        width: 100
      });
    });
    it('leaves accessible recources intact', () => {
      const result = sut.redactContent({
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      }, '12345');
      expect(result).toStrictEqual({
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      });
    });
  });

  describe('getCdnResources', () => {
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'https://someplace.com/image.png',
        width: 100
      });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({
        sourceUrl: '',
        width: 100
      });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal public resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'media/12345/some-image.png',
        width: 100
      });
      expect(result).toEqual(['media/12345/some-image.png']);
    });
    it('returns a list with the url for an internal private resource', () => {
      const result = sut.getCdnResources({
        sourceUrl: 'rooms/12345/media/some-image.png',
        width: 100
      });
      expect(result).toEqual(['rooms/12345/media/some-image.png']);
    });
  });
});
