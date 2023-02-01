import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2023-01-20-01-correct-volume-presets-in-multitrack-data.js';

describe('educandu-2023-01-20-01-correct-volume-presets-in-multitrack-data', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('tryProcessSectionContent', () => {
    it('returns false when the data is correct', () => {
      const content = {
        secondaryTracks: [{ name: '1' }, { name: '2' }],
        volumePresets: [
          { mainTrack: 1, secondaryTracks: [1, 1] },
          { mainTrack: 0.5, secondaryTracks: [0.5, 0.5] }
        ]
      };
      const originalContent = JSON.parse(JSON.stringify(content));
      const result = sut.tryProcessSectionContent(content);
      expect(result).toBe(false);
      expect(content).toStrictEqual(originalContent);
    });

    it('returns true and corrects shorted or longer volume presets secondary track arrays', () => {
      const content = {
        secondaryTracks: [{ name: '1' }, { name: '2' }],
        volumePresets: [
          { mainTrack: 1, secondaryTracks: [1, 1] },
          { mainTrack: 0.5, secondaryTracks: [] },
          { mainTrack: 0.5, secondaryTracks: [0.5] },
          { mainTrack: 0.5, secondaryTracks: [0.5, 0.5, 0.5] }
        ]
      };
      const expectedContent = {
        secondaryTracks: [{ name: '1' }, { name: '2' }],
        volumePresets: [
          { mainTrack: 1, secondaryTracks: [1, 1] },
          { mainTrack: 0.5, secondaryTracks: [1, 1] },
          { mainTrack: 0.5, secondaryTracks: [0.5, 1] },
          { mainTrack: 0.5, secondaryTracks: [0.5, 0.5] }
        ]
      };
      const result = sut.tryProcessSectionContent(content);
      expect(result).toBe(true);
      expect(content).toStrictEqual(expectedContent);
    });
  });
});
