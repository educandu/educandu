import { createSandbox } from 'sinon';
import uniqueId from '../src/utils/unique-id.js';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import MigrationScript from './educandu-2023-02-10-03-change-data-model-for-media-analysis-plugin.js';

describe('educandu-2023-02-10-03-change-data-model-for-media-analysis-plugin', () => {
  let sut;
  const sandbox = createSandbox();

  beforeEach(() => {
    const fakeDb = {};
    sandbox.stub(uniqueId, 'create').returns('createdId');
    sut = new MigrationScript(fakeDb);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('sectionUp', () => {
    it('migrates the section data', () => {
      const section = {
        content: {
          mainTrack: {
            name: 'Main track',
            sourceUrl: 'cdn://document-media/123/track1.mp4',
            copyrightNotice: 'Copyright for main track',
            aspectRatio: '16:9',
            showVideo: true,
            playbackRange: [0.2, 0.6],
            posterImage: {
              sourceUrl: 'cdn://document-media/123/poster.jpeg'
            }
          },
          secondaryTracks: [
            {
              name: 'Secondary track 1',
              sourceUrl: 'cdn://document-media/123/track2.mp4',
              copyrightNotice: 'Copyright for secondary track 1'
            },
            {
              name: 'Secondary track 2',
              sourceUrl: 'cdn://document-media/123/track3.mp4',
              copyrightNotice: 'Copyright for secondary track 2'
            }
          ],
          volumePresets: [
            {
              name: 'Default',
              mainTrack: 0.8,
              secondaryTracks: [0.9, 1]
            },
            {
              name: 'Half',
              mainTrack: 0.4,
              secondaryTracks: [0.5, 0.6]
            }
          ],
          chapters: [
            {
              title: 'Single chapter'
            }
          ],
          width: 100,
          initialVolume: 1
        }
      };

      const result = sut.sectionUp(section);
      expect(result).toStrictEqual({
        content: {
          tracks: [
            {
              key: 'createdId',
              name: 'Main track',
              sourceUrl: 'cdn://document-media/123/track1.mp4',
              copyrightNotice: 'Copyright for main track',
              playbackRange: [0.2, 0.6]
            },
            {
              key: 'createdId',
              name: 'Secondary track 1',
              sourceUrl: 'cdn://document-media/123/track2.mp4',
              copyrightNotice: 'Copyright for secondary track 1',
              playbackRange: [0, 1]
            },
            {
              key: 'createdId',
              name: 'Secondary track 2',
              sourceUrl: 'cdn://document-media/123/track3.mp4',
              copyrightNotice: 'Copyright for secondary track 2',
              playbackRange: [0, 1]
            }
          ],
          volumePresets: [
            {
              name: 'Default',
              tracks: [0.8, 0.9, 1]
            },
            {
              name: 'Half',
              tracks: [0.4, 0.5, 0.6]
            }
          ],
          chapters: [
            {
              title: 'Single chapter'
            }
          ],
          aspectRatio: '16:9',
          showVideo: true,
          posterImage: {
            sourceUrl: 'cdn://document-media/123/poster.jpeg'
          },
          width: 100,
          initialVolume: 1
        }
      });
    });
  });
});
