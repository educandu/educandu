import { SIZE } from './constants.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { ensureIsUnique, getSymmetricalDifference } from '../../utils/array-utils.js';
import { getRandomizedTilesFromPairs, resizeTilePairs } from './matching-cards-utils.js';

describe('matching-cards-utils', () => {
  let result;

  describe('resizeTilePairs', () => {
    let tilePairs;

    describe('when resizing to a bigger count', () => {
      beforeEach(() => {
        tilePairs = [
          [{ text: '1a', sourceUrl: 'url' }, { text: '1b', sourceUrl: 'url' }],
          [{ text: '2a', sourceUrl: 'url' }, { text: '2b', sourceUrl: 'url' }],
          [{ text: '3a', sourceUrl: 'url' }, { text: '3b', sourceUrl: 'url' }],
          [{ text: '4a', sourceUrl: 'url' }, { text: '4b', sourceUrl: 'url' }]
        ];
        result = resizeTilePairs(tilePairs, SIZE.fourByFour);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [{ text: '1a', sourceUrl: 'url' }, { text: '1b', sourceUrl: 'url' }], [{ text: '2a', sourceUrl: 'url' }, { text: '2b', sourceUrl: 'url' }],
          [{ text: '3a', sourceUrl: 'url' }, { text: '3b', sourceUrl: 'url' }], [{ text: '4a', sourceUrl: 'url' }, { text: '4b', sourceUrl: 'url' }],
          [{ text: '', sourceUrl: '' }, { text: '', sourceUrl: '' }], [{ text: '', sourceUrl: '' }, { text: '', sourceUrl: '' }],
          [{ text: '', sourceUrl: '' }, { text: '', sourceUrl: '' }], [{ text: '', sourceUrl: '' }, { text: '', sourceUrl: '' }]
        ]);
      });
    });

    describe('when resizing to a smaller count', () => {
      beforeEach(() => {
        tilePairs = [
          [{ text: '1a', sourceUrl: 'url' }, { text: '1b', sourceUrl: 'url' }], [{ text: '2a', sourceUrl: 'url' }, { text: '2b', sourceUrl: 'url' }],
          [{ text: '3a', sourceUrl: 'url' }, { text: '3b', sourceUrl: 'url' }], [{ text: '4a', sourceUrl: 'url' }, { text: '4b', sourceUrl: 'url' }],
          [{ text: '5a', sourceUrl: 'url' }, { text: '5b', sourceUrl: 'url' }], [{ text: '6a', sourceUrl: 'url' }, { text: '6b', sourceUrl: 'url' }],
          [{ text: '7a', sourceUrl: 'url' }, { text: '7b', sourceUrl: 'url' }], [{ text: '8a', sourceUrl: 'url' }, { text: '8b', sourceUrl: 'url' }]
        ];
        result = resizeTilePairs(tilePairs, SIZE.threeByThree);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [{ text: '1a', sourceUrl: 'url' }, { text: '1b', sourceUrl: 'url' }],
          [{ text: '2a', sourceUrl: 'url' }, { text: '2b', sourceUrl: 'url' }],
          [{ text: '3a', sourceUrl: 'url' }, { text: '3b', sourceUrl: 'url' }],
          [{ text: '4a', sourceUrl: 'url' }, { text: '4b', sourceUrl: 'url' }]
        ]);
      });
    });
  });

  describe('getRandomizedTilesFromPairs', () => {
    let tilePairs;

    beforeEach(() => {
      tilePairs = [
        [{ text: '1a', sourceUrl: 'url' }, { text: '1b', sourceUrl: 'url' }],
        [{ text: '2a', sourceUrl: 'url' }, { text: '2b', sourceUrl: 'url' }],
        [{ text: '3a', sourceUrl: 'url' }, { text: '3b', sourceUrl: 'url' }],
        [{ text: '4a', sourceUrl: 'url' }, { text: '4b', sourceUrl: 'url' }]
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
