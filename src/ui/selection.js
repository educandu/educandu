export const NONE = 'none';
export const SINGLE = 'single';
export const MULTIPLE = 'multiple';

export function removeInvalidKeys(allKeys, validKeys) {
  return allKeys.filter(key => validKeys.includes(key));
}

export function addKeyToSelection(selectedKeys, keyToAdd, selectionMode) {
  switch (selectionMode) {
    case SINGLE:
      return [keyToAdd];
    case MULTIPLE:
      return [...selectedKeys, keyToAdd].sort();
    default:
      return [];
  }
}

export function removeKeyFromSelection(selectedKeys, keyToRemove, selectionMode) {
  switch (selectionMode) {
    case SINGLE:
    case MULTIPLE:
      return selectedKeys.filter(key => key !== keyToRemove).sort();
    default:
      return [];
  }
}

export default {
  NONE,
  SINGLE,
  MULTIPLE,
  removeInvalidKeys,
  addKeyToSelection,
  removeKeyFromSelection
};
