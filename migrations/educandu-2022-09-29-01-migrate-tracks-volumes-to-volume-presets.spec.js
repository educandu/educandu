import { beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2022-09-29-01-migrate-tracks-volumes-to-volume-presets.js';

const MULTITRACK_MEDIA_SECTION = {
  key: '9HdStbMHyhM52TPR8iDfFB',
  revision: 'wXJk8bjrR99MNoScU2YhbL',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  type: 'media-analysis',
  content: {
    width: 100,
    mainTrack:
      {
        name: 'Main track',
        sourceType: 'internal',
        sourceUrl: 'https://main.track',
        copyrightNotice: 'Main track copyright',
        aspectRatio: '16:9',
        showVideo: true,
        playbackRange: [0, 1],
        volume: 0.1
      },
    secondaryTracks: [
      {
        name: 'Secondary track 1',
        sourceType: 'internal',
        sourceUrl: 'https://first-secondary.track',
        copyrightNotice: 'First secondary track copyright',
        volume: 0.2
      },
      {
        name: 'Secondary track 2',
        sourceType: 'internal',
        sourceUrl: 'https://second-secondary.track',
        copyrightNotice: 'Second secondary track copyright',
        volume: 0.3
      }
    ]
  }
};

const MIGRATED_MULTITRACK_MEDIA_SECTION = {
  key: '9HdStbMHyhM52TPR8iDfFB',
  revision: 'wXJk8bjrR99MNoScU2YhbL',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  type: 'media-analysis',
  content: {
    width: 100,
    mainTrack:
      {
        name: 'Main track',
        sourceType: 'internal',
        sourceUrl: 'https://main.track',
        copyrightNotice: 'Main track copyright',
        aspectRatio: '16:9',
        showVideo: true,
        playbackRange: [0, 1]
      },
    secondaryTracks: [
      {
        name: 'Secondary track 1',
        sourceType: 'internal',
        sourceUrl: 'https://first-secondary.track',
        copyrightNotice: 'First secondary track copyright'
      },
      {
        name: 'Secondary track 2',
        sourceType: 'internal',
        sourceUrl: 'https://second-secondary.track',
        copyrightNotice: 'Second secondary track copyright'
      }
    ],
    volumePresets: [
      {
        name: 'Default',
        mainTrack: 0.1,
        secondaryTracks: [0.2, 0.3]
      }
    ]
  }
};

describe('educandu-2022-09-29-01-migrate-tracks-volumes-to-volume-presets', () => {
  let sut;

  beforeEach(() => {
    const fakeDb = {};
    sut = new MigrationScript(fakeDb);
  });

  describe('sectionUp', () => {
    it('adds volumePresets to multitrack-media/media-analysis data structure', () => {
      const section = JSON.parse(JSON.stringify(MULTITRACK_MEDIA_SECTION));
      const result = sut.sectionUp(section);
      expect(result).toStrictEqual(MIGRATED_MULTITRACK_MEDIA_SECTION);
    });
  });

  describe('sectionDown', () => {
    it('removed volumePresets from multitrack-media/media-analysis data structure', () => {
      const section = JSON.parse(JSON.stringify(MIGRATED_MULTITRACK_MEDIA_SECTION));
      const result = sut.sectionDown(section);
      expect(result).toStrictEqual(MULTITRACK_MEDIA_SECTION);
    });
  });
});
