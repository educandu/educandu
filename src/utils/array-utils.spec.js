import {
  swapItemsAt,
  insertItemAt,
  removeItemAt,
  ensureIsIncluded,
  ensureIsExcluded,
  shuffleItems
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
    it('adds the item at the beginning', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, -1, 0);
      expect(result).toEqual([-1, 0, 1, 2, 3]);
    });
    it('adds the item in the middle', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, 1.5, 2);
      expect(result).toEqual([0, 1, 1.5, 2, 3]);
    });
    it('adds the item at the end', () => {
      const items = [0, 1, 2, 3];
      const result = insertItemAt(items, 4, 4);
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

});
