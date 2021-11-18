import sut from './info.js';
import { SOUND_TYPE } from './constants.js';

describe('ear-training-info', () => {
  describe('getCdnResources', () => {
    it('returns empty list if there is no sound specified', () => {
      const result = sut.getCdnResources({ tests: [{ sound: null }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for a MIDI resource', () => {
      const result = sut.getCdnResources({ tests: [{ sound: { type: SOUND_TYPE.midi } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an external resource', () => {
      const result = sut.getCdnResources({ tests: [{ sound: { type: SOUND_TYPE.external, url: 'https://someplace.com/sound.mp3' } }] });
      expect(result).toHaveLength(0);
    });
    it('returns empty list for an internal resource without url', () => {
      const result = sut.getCdnResources({ tests: [{ sound: { type: SOUND_TYPE.external, url: null } }] });
      expect(result).toHaveLength(0);
    });
    it('returns a list with the url for an internal resource', () => {
      const result = sut.getCdnResources({ tests: [{ sound: { type: SOUND_TYPE.internal, url: 'media/some-sound.mp3' } }] });
      expect(result).toEqual(['media/some-sound.mp3']);
    });
    it('returns a list with all urls for all internal resources', () => {
      const result = sut.getCdnResources({
        tests: [
          { sound: { type: SOUND_TYPE.internal, url: 'media/some-sound-1.mp3' } },
          { sound: { type: SOUND_TYPE.external, url: 'https://someplace.com/some-sound-2.mp3' } },
          { sound: { type: SOUND_TYPE.internal, url: 'media/some-sound-3.mp3' } }
        ]
      });
      expect(result).toEqual(['media/some-sound-1.mp3', 'media/some-sound-3.mp3']);
    });
  });
});
