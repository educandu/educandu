import { SIZE } from './constants.js';
import { getRandomizedTilesFromPairs, resizeTilePairs } from './memory-utils.js';
import { ensureIsUnique, getSymmetricalDifference } from '../../utils/array-utils.js';

describe('memory-utils', () => {
  let result;

  describe('resizeTilePairs', () => {
    let tilePairs;

    describe('when resizing to a bigger count', () => {
      beforeEach(() => {
        tilePairs = [
          [{ text: '1a' }, { text: '1b' }],
          [{ text: '2a' }, { text: '2b' }],
          [{ text: '3a' }, { text: '3b' }],
          [{ text: '4a' }, { text: '4b' }]
        ];
        result = resizeTilePairs(tilePairs, SIZE.fourByFour);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [{ text: '1a' }, { text: '1b' }], [{ text: '2a' }, { text: '2b' }],
          [{ text: '3a' }, { text: '3b' }], [{ text: '4a' }, { text: '4b' }],
          [{ text: '' }, { text: '' }], [{ text: '' }, { text: '' }],
          [{ text: '' }, { text: '' }], [{ text: '' }, { text: '' }]
        ]);
      });
    });

    describe('when resizing to a smaller count', () => {
      beforeEach(() => {
        tilePairs = [
          [{ text: '1a' }, { text: '1b' }], [{ text: '2a' }, { text: '2b' }],
          [{ text: '3a' }, { text: '3b' }], [{ text: '4a' }, { text: '4b' }],
          [{ text: '5a' }, { text: '5b' }], [{ text: '6a' }, { text: '6b' }],
          [{ text: '7a' }, { text: '7b' }], [{ text: '8a' }, { text: '8b' }]
        ];
        result = resizeTilePairs(tilePairs, SIZE.threeByThree);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [{ text: '1a' }, { text: '1b' }],
          [{ text: '2a' }, { text: '2b' }],
          [{ text: '3a' }, { text: '3b' }],
          [{ text: '4a' }, { text: '4b' }]
        ]);
      });
    });
  });

  describe('getRandomizedTilesFromPairs', () => {
    let tilePairs;

    beforeEach(() => {
      tilePairs = [
        [{ text: '1a' }, { text: '1b' }],
        [{ text: '2a' }, { text: '2b' }],
        [{ text: '3a' }, { text: '3b' }],
        [{ text: '4a' }, { text: '4b' }]
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
