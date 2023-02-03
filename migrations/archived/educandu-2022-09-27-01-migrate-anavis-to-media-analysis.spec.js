import { createSandbox } from 'sinon';
import uniqueId from '../../src/utils/unique-id.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import MigrationScript from './educandu-2022-09-27-01-migrate-anavis-to-media-analysis.js';

const ANAVIS_SECTION = {
  key: '9HdStbMHyhM52TPR8iDfFB',
  revision: 'wXJk8bjrR99MNoScU2YhbL',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  type: 'anavis',
  content: {
    width: 100,
    parts: [
      {
        name: 'Part A',
        color: '#aaaaaa',
        length: 100,
        annotations: [
          'Episode a',
          '1. Section x 2.',
          ''
        ]
      },
      {
        name: 'Part B',
        color: '#bbbbbb',
        length: 300,
        annotations: ['Episode b']
      },
      {
        name: 'Part C',
        color: '#cccccc',
        length: 100,
        annotations: []
      }
    ],
    media: {
      kind: 'video',
      aspectRatio: '16:9',
      sourceType: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=abcdef',
      copyrightNotice: 'source: https://www.youtube.com/watch?v=abcdef'
    }
  }
};

const MEDIA_ANALYSIS_SECTION = {
  key: '9HdStbMHyhM52TPR8iDfFB',
  revision: 'wXJk8bjrR99MNoScU2YhbL',
  deletedOn: null,
  deletedBy: null,
  deletedBecause: null,
  type: 'media-analysis',
  content: {
    width: 100,
    mainTrack: {
      name: '',
      sourceType: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=abcdef',
      copyrightNotice: 'source: https://www.youtube.com/watch?v=abcdef',
      aspectRatio: '16:9',
      showVideo: true,
      playbackRange: [0, 1],
      volume: 1
    },
    secondaryTracks: [],
    chapters: [
      {
        key: 'createdId',
        startPosition: 0,
        color: '#aaaaaa',
        title: 'Part A',
        text: 'Episode a\n\n1\\. Section x 2.'
      },
      {
        key: 'createdId',
        startPosition: 0.2,
        color: '#bbbbbb',
        title: 'Part B',
        text: 'Episode b'
      },
      {
        key: 'createdId',
        startPosition: 0.8,
        color: '#cccccc',
        title: 'Part C',
        text: ''
      }
    ]
  }
};

describe('educandu-2022-09-27-01-migrate-anavis-to-media-analysis', () => {
  let sut;
  const sandbox = createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    const fakeDb = {};
    sandbox.stub(uniqueId, 'create').returns('createdId');
    sut = new MigrationScript(fakeDb);
  });

  describe('sectionUp', () => {
    it('converts the anavis data structure to the media-analysis data structure correctly', () => {
      const anavisSection = JSON.parse(JSON.stringify(ANAVIS_SECTION));
      const result = sut.sectionUp(anavisSection);
      expect(result).toStrictEqual(MEDIA_ANALYSIS_SECTION);
    });
  });
});
