import AudioInfo from './info.js';
import { SOURCE_TYPE } from './constants.js';

describe('audio-info', () => {
  let sut;
  beforeEach(() => {
    sut = new AudioInfo();
  });

  describe('getCdnResources', () => {
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.external, url: 'https://someplace.com/sound.mp3' });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.internal, url: null });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ type: SOURCE_TYPE.internal, url: 'media/some-sound.mp3' });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
  });
});
