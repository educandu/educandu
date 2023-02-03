import { SIZE } from './constants.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureIsUnique, getSymmetricalDifference } from '../../utils/array-utils.js';
import { getRandomizedTilesFromPairs, resizeTilePairs } from './matching-cards-utils.js';

const createTile = ({ text, sourceUrl, playbackRange } = {}) => ({
  text: text || '',
  sourceUrl: sourceUrl || '',
  playbackRange: playbackRange || [0, 1]
});

describe('matching-cards-utils', () => {
  let result;

  describe('resizeTilePairs', () => {
    let tilePairs;

    describe('when resizing to a bigger count', () => {
      beforeEach(() => {
        tilePairs = [
          [createTile({ text: '1a' }), createTile({ text: '1b' })],
          [createTile({ text: '2a' }), createTile({ text: '2b' })],
          [createTile({ text: '3a' }), createTile({ text: '3b' })],
          [createTile({ text: '4a' }), createTile({ text: '4b' })]
        ];
        result = resizeTilePairs(tilePairs, SIZE.fourByFour);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [createTile({ text: '1a' }), createTile({ text: '1b' })], [createTile({ text: '2a' }), createTile({ text: '2b' })],
          [createTile({ text: '3a' }), createTile({ text: '3b' })], [createTile({ text: '4a' }), createTile({ text: '4b' })],
          [createTile(), createTile()], [createTile(), createTile()],
          [createTile(), createTile()], [createTile(), createTile()]
        ]);
      });
    });

    describe('when resizing to a smaller count', () => {
      beforeEach(() => {
        tilePairs = [
          [createTile({ text: '1a' }), createTile({ text: '1b' })], [createTile({ text: '2a' }), createTile({ text: '2b' })],
          [createTile({ text: '3a' }), createTile({ text: '3b' })], [createTile({ text: '4a' }), createTile({ text: '4b' })],
          [createTile({ text: '5a' }), createTile({ text: '5b' })], [createTile({ text: '6a' }), createTile({ text: '6b' })],
          [createTile({ text: '7a' }), createTile({ text: '7b' })], [createTile({ text: '8a' }), createTile({ text: '8b' })]
        ];
        result = resizeTilePairs(tilePairs, SIZE.threeByThree);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [createTile({ text: '1a' }), createTile({ text: '1b' })],
          [createTile({ text: '2a' }), createTile({ text: '2b' })],
          [createTile({ text: '3a' }), createTile({ text: '3b' })],
          [createTile({ text: '4a' }), createTile({ text: '4b' })]
        ]);
      });
    });
  });

  describe('getRandomizedTilesFromPairs', () => {
    let tilePairs;

    beforeEach(() => {
      tilePairs = [
        [createTile({ text: '1a' }), createTile({ text: '1b' })],
        [createTile({ text: '2a' }), createTile({ text: '2b' })],
        [createTile({ text: '3a' }), createTile({ text: '3b' })],
        [createTile({ text: '4a' }), createTile({ text: '4b' })]
      ];
      result = getRandomizedTilesFromPairs(tilePairs, SIZE.threeByThree);
    });

    it('returns a flat array', () => {
      expect(result.length).toBe(tilePairs.length * 2);
    });

    it('returns an array out of all tiles in the tile pairs', () => {
      expect(getSymmetricalDifference(
        result.map(tile => tile.text),
        tilePairs.flat().map(tile => tile.text)
      )).toEqual([]);
    });

    it('returns an array with unique pair keys', () => {
      const uniquePairKeys = ensureIsUnique(result.map(tile => tile.pairKey));
      expect(uniquePairKeys.length).toBe(tilePairs.length);

      uniquePairKeys.forEach(pairKey => {
        const tilePair = result.filter(tile => tile.pairKey === pairKey);
        expect(tilePair.length).toBe(2);
        expect(tilePair[0].text.substr(0, 1) === tilePair[1].text.substr(0, 1));
      });
    });

    it('returns an array with unique keys', () => {
      const uniqueKeys = ensureIsUnique(result.map(tile => tile.key));
      expect(uniqueKeys.length).toBe(tilePairs.flat().length);
    });
  });
});
