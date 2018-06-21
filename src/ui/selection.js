const NONE = 'none';
const SINGLE = 'single';
const MULTIPLE = 'multiple';

function removeInvalidKeys(allKeys, validKeys) {
  return allKeys.filter(key => validKeys.includes(key));
}

function addKeyToSelection(selectedKeys, keyToAdd, selectionMode) {
  switch (selectionMode) {
    case SINGLE:
      return [keyToAdd];
    case MULTIPLE:
      return [...selectedKeys, keyToAdd].sort();
    default:
      return [];
  }
}

function removeKeyFromSelection(selectedKeys, keyToRemove, selectionMode) {
  switch (selectionMode) {
    case SINGLE:
    case MULTIPLE:
      return selectedKeys.filter(key => key !== keyToRemove).sort();
    default:
      return [];
  }
}

module.exports = {
  removeInvalidKeys,
  addKeyToSelection,
  removeKeyFromSelection,
  NONE,
  SINGLE,
  MULTIPLE
};
