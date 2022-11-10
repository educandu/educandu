import { SIZE } from './constants.js';
import uniqueId from '../../utils/unique-id.js';
import { shuffleItems } from '../../utils/array-utils.js';

export const createDefaultTile = () => ({
  text: '',
  sourceUrl: ''
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
  const tilesWithKeys = tilePairs
    .map(tilePair => {
      const pairKey = uniqueId.create();
      return [
        {
          ...tilePair[0],
          key: uniqueId.create(),
          pairKey
        },
        {
          ...tilePair[1],
          key: uniqueId.create(),
          pairKey
        }
      ];
    })
    .flat();

  return shuffleItems(tilesWithKeys);
};
