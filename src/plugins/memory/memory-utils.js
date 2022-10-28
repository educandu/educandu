import { DIMENSION } from './constants.js';

export const createDefaultTile = () => ({
  text: ''
});

export const getTilePairCountByDimension = dimension => {
  switch (dimension) {
    case DIMENSION.threeByThree:
      return 4;
    case DIMENSION.fourByFour:
      return 8;
    default:
      throw Error(`Unsupported dimension '${dimension}'`);
  }
};
