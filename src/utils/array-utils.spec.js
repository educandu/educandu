import {
  swapItemsAt,
  insertItemAt,
  removeItemAt,
  ensureIsIncluded,
  ensureIsExcluded,
  shuffleItems,
  replaceItemAt,
  replaceItem,
  splitIntoChunks,
  range
} from './array-utils.js';

describe('array-utils', () => {

  describe('swapItemsAt', () => {
    it('does not mutate the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = swapItemsAt(input, 1, 4);
      expect(result).not.toBe(input);
      expect(input).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    it('swaps the correct indices', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = swapItemsAt(input, 1, 4);
      expect(result).toEqual([0, 4, 2, 3, 1, 5, 6, 7, 8, 9]);
    });
    it('returns the original array if one of the indices is out of range', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = swapItemsAt(input, 1, 10);
      expect(result).toBe(input);
    });
    it('returns the original array if one of the indices are identical', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = swapItemsAt(input, 4, 4);
      expect(result).toBe(input);
    });
  });

  describe('insertItemAt', () => {
    it('does not mutate the original array', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, 4, 2);
      expect(result).not.toBe(items);
      expect(items).toEqual([0, 1, 2, 3]);
    });
    it('adds the item at the beginning when index is 0', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, -1, 0);
      expect(result).toEqual([-1, 0, 1, 2, 3]);
    });
    it('adds the item at the beginning when index is < 0', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, -1, -1);
      expect(result).toEqual([-1, 0, 1, 2, 3]);
    });
    it('adds the item in the middle', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, 1.5, 2);
      expect(result).toEqual([0, 1, 1.5, 2, 3]);
    });
    it('adds the item at the end when index is array length', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, 4, 4);
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });
    it('adds the item at the end when index is > array length', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, 4, 5);
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('removeItemAt', () => {
    it('does not mutate the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = removeItemAt(input, 4);
      expect(result).not.toBe(input);
      expect(input).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    it('removes the item on the correct index', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = removeItemAt(input, 4);
      expect(result).toEqual([0, 1, 2, 3, 5, 6, 7, 8, 9]);
    });
    it('returns the original array if the index is out of range', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = removeItemAt(input, 10);
      expect(result).toBe(input);
    });
  });

  describe('replaceItemAt', () => {
    it('does not mutate the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = replaceItemAt(input, 37, 4);
      expect(result).not.toBe(input);
      expect(input).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    it('replaces the item on the correct index', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = replaceItemAt(input, 37, 4);
      expect(result).toEqual([0, 1, 2, 3, 37, 5, 6, 7, 8, 9]);
    });
    it('returns the original array if the index is out of range', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = replaceItemAt(input, 37, 10);
      expect(result).toBe(input);
    });
  });

  describe('replaceItem', () => {
    it('does not mutate the original array', () => {
      const input = [{ _id: 0, prop: 'a1' }, { _id: 1, prop: 'a2' }, { _id: 2, prop: 'a3' }];
      const result = replaceItem(input, { _id: 1, prop: 'b' });
      expect(result).not.toBe(input);
      expect(input).toEqual([{ _id: 0, prop: 'a1' }, { _id: 1, prop: 'a2' }, { _id: 2, prop: 'a3' }]);
    });
    it('replaces the correct item', () => {
      const input = [{ _id: 0, prop: 'a1' }, { _id: 1, prop: 'a2' }, { _id: 2, prop: 'a3' }];
      const result = replaceItem(input, { _id: 1, prop: 'b' });
      expect(result).not.toBe(input);
      expect(result).toEqual([{ _id: 0, prop: 'a1' }, { _id: 1, prop: 'b' }, { _id: 2, prop: 'a3' }]);
    });
    it('uses the third parameter to match the item', () => {
      const input = [{ _id: 0, prop: 'a1' }, { _id: 1, prop: 'a2' }, { _id: 2, prop: 'a3' }];
      const result = replaceItem(input, { _id: 24, prop: 'a2' }, 'prop');
      expect(result).not.toBe(input);
      expect(result).toEqual([{ _id: 0, prop: 'a1' }, { _id: 24, prop: 'a2' }, { _id: 2, prop: 'a3' }]);
    });
  });

  describe('ensureIsIncluded', () => {
    it('returns the original array if the item was already included in the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ensureIsIncluded(input, 4);
      expect(result).toBe(input);
    });
    it('returns a new array with the item added if the item was not already included in the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ensureIsIncluded(input, 10);
      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
    it('does not mutate the original array if the item was not already included in the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ensureIsIncluded(input, 10);
      expect(result).not.toBe(input);
      expect(input).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('ensureIsExcluded', () => {
    it('returns the original array if the item was not included anyway in the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ensureIsExcluded(input, 10);
      expect(result).toBe(input);
    });
    it('returns a new array with the item removed if the item was included in the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ensureIsExcluded(input, 4);
      expect(result).toEqual([0, 1, 2, 3, 5, 6, 7, 8, 9]);
    });
    it('does not mutate the original array if the item was included in the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ensureIsExcluded(input, 4);
      expect(result).not.toBe(input);
      expect(input).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('shuffleItems', () => {
    it('does not mutate the original array', () => {
      const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = shuffleItems(input);
      expect(result).not.toBe(input);
      expect(input).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('splitIntoChunks', () => {
    it('splits arrays correctly into chunks of 2', () => {
      const input = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(splitIntoChunks(input, 2)).toStrictEqual([['a', 'b'], ['c', 'd'], ['e', 'f']]);
    });

    it('splits arrays correctly into chunks of 3', () => {
      const input = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(splitIntoChunks(input, 3)).toStrictEqual([['a', 'b', 'c'], ['d', 'e', 'f']]);
    });

    it('handles the last chunk correctly', () => {
      const input = ['a', 'b', 'c', 'd', 'e', 'f', 'foo'];
      expect(splitIntoChunks(input, 6)).toStrictEqual([['a', 'b', 'c', 'd', 'e', 'f'], ['foo']]);
    });
  });

  describe('range', () => {
    const testCases = [
      { from: 0, to: 0, expectedResult: [0] },
      { from: 0, to: 0, step: 0, expectedResult: [0] },
      { from: 3, to: 1, step: 1, expectedResult: [3, 2, 1] },
      { from: 3, to: 1, step: -1, expectedResult: [3, 2, 1] },
      { from: -3, to: 1, step: 1, expectedResult: [-3, -2, -1, 0, 1] },
      { from: -3, to: 1, step: -1, expectedResult: [-3, -2, -1, 0, 1] },
      { from: -3, to: -1, step: 1, expectedResult: [-3, -2, -1] },
      { from: -3, to: -1, step: -1, expectedResult: [-3, -2, -1] },
      { from: 3, to: -1, step: 1, expectedResult: [3, 2, 1, 0, -1] },
      { from: 3, to: -1, step: -1, expectedResult: [3, 2, 1, 0, -1] },
      { from: 1, to: 3, step: 1, expectedResult: [1, 2, 3] },
      { from: 1, to: 3, step: -1, expectedResult: [1, 2, 3] },
      { from: -1, to: 3, step: 1, expectedResult: [-1, 0, 1, 2, 3] },
      { from: -1, to: 3, step: -1, expectedResult: [-1, 0, 1, 2, 3] },
      { from: -1, to: -3, step: 1, expectedResult: [-1, -2, -3] },
      { from: -1, to: -3, step: -1, expectedResult: [-1, -2, -3] },
      { from: 1, to: -3, step: 1, expectedResult: [1, 0, -1, -2, -3] },
      { from: 1, to: -3, step: -1, expectedResult: [1, 0, -1, -2, -3] },
      { from: 0, to: 20, step: 5, expectedResult: [0, 5, 10, 15, 20] },
      { from: 0, to: 20, step: -5, expectedResult: [0, 5, 10, 15, 20] }
    ];

    testCases.forEach(({ from, to, step, expectedResult }) => {
      it(`returns [${expectedResult}] when { from: ${from}, to: ${to}, step: ${step} }`, () => {
        const result = range({ from, to, step });
        expect(result).toEqual(expectedResult);
      });
    });
  });
});
