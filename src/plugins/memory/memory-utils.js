import { SIZE } from './constants.js';
import { shuffleItems } from '../../utils/array-utils.js';

export const createDefaultTile = () => ({
  text: ''
});

export const getTilePairCountBySize = size => {
  switch (size) {
    case SIZE.threeByThree:
      return 4;
    case SIZE.fourByFour:
      return 8;
    default:
      throw Error(`Unsupported size '${size}'`);
  }
};

export const resizeTilePairs = (oldTilePairs, newSize) => {
  const length = getTilePairCountBySize(newSize);
  const newTilePairs = Array.from(
    { length },
    (_, index) => oldTilePairs[index] || [createDefaultTile(), createDefaultTile()]
  );

  return newTilePairs;
};

export const getRandomizedTilesFromPairs = tilePairs => {
  const tiles = tilePairs.flat();
  return shuffleItems(tiles);
};
