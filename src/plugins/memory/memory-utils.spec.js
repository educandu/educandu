import { SIZE } from './constants.js';
import { resizeTilePairs } from './memory-utils.js';

describe('memory-utils', () => {
  let result;

  describe('resizeTilePairs', () => {
    let tilePairs;

    describe('when resizing to a bigger count', () => {
      beforeEach(() => {
        tilePairs = [
          [{ text: '1' }, { text: '1' }],
          [{ text: '2' }, { text: '2' }],
          [{ text: '3' }, { text: '3' }],
          [{ text: '4' }, { text: '4' }]
        ];
        result = resizeTilePairs(tilePairs, SIZE.fourByFour);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [{ text: '1' }, { text: '1' }], [{ text: '2' }, { text: '2' }],
          [{ text: '3' }, { text: '3' }], [{ text: '4' }, { text: '4' }],
          [{ text: '' }, { text: '' }], [{ text: '' }, { text: '' }],
          [{ text: '' }, { text: '' }], [{ text: '' }, { text: '' }]
        ]);
      });
    });
    describe('when resizing to a smaller count', () => {
      beforeEach(() => {
        tilePairs = [
          [{ text: '1' }, { text: '1' }], [{ text: '2' }, { text: '2' }],
          [{ text: '3' }, { text: '3' }], [{ text: '4' }, { text: '4' }],
          [{ text: '5' }, { text: '5' }], [{ text: '6' }, { text: '6' }],
          [{ text: '7' }, { text: '7' }], [{ text: '8' }, { text: '8' }]
        ];
        result = resizeTilePairs(tilePairs, SIZE.threeByThree);
      });

      it('copies over the existing content', () => {
        expect(result).toStrictEqual([
          [{ text: '1' }, { text: '1' }],
          [{ text: '2' }, { text: '2' }],
          [{ text: '3' }, { text: '3' }],
          [{ text: '4' }, { text: '4' }]
        ]);
      });
    });
  });
});
