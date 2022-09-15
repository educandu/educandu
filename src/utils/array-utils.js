export function swapItemsAt(items, index1, index2) {
  const lastIndex = items.length - 1;
  if (index1 < 0 || index2 < 0 || index1 > lastIndex || index2 > lastIndex || index1 === index2) {
    return items;
  }

  const result = items.slice();

  const item1 = result[index1];
  const item2 = result[index2];
  result[index1] = item2;
  result[index2] = item1;
  return result;
}

export const moveItem = (items, fromIndex, toIndex) => {
  const result = [...items];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

export function insertItemAt(items, item, index) {
  const lastIndex = items.length - 1;

  if (index >= lastIndex + 1) {
    return [...items, item];
  }

  if (index <= 0) {
    return [item, ...items];
  }

  if (index > 0 && index <= lastIndex) {
    return [...items.slice(0, index), item, ...items.slice(index)];
  }

  return items;
}

export function removeItemAt(items, index) {
  const lastIndex = items.length - 1;
  if (index < 0 || index > lastIndex) {
    return items;
  }

  return items.filter((t, i) => i !== index);
}

export function replaceItemAt(items, newItem, index) {
  if (!items || index < 0 || index > (items.length - 1)) {
    return items;
  }

  const result = items.slice();
  result[index] = newItem;

  return result;
}

export function replaceItem(items, newItem, keyToMatch = '_id') {
  return items.map(item => item[keyToMatch] === newItem[keyToMatch] ? newItem : item);
}

export function ensureIsIncluded(items, item) {
  return items.includes(item) ? items : [...items, item];
}

export function ensureIsExcluded(items, item) {
  return items.includes(item) ? items.filter(i => i !== item) : items;
}

export function shuffleItems(items) {
  const result = items.slice();

  for (let index = result.length - 1; index > 0; index -= 1) {
    const newIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[newIndex]] = [result[newIndex], result[index]];
  }

  return result;
}

export function splitIntoChunks(items, maxLength) {
  const result = [];

  let currentChunk = [];
  for (let i = 0; i < items.length; i += 1) {
    currentChunk.push(items[i]);
    if (currentChunk.length === maxLength || i === items.length - 1) {
      result.push(currentChunk);
      currentChunk = [];
    }
  }

  return result;
}

export function ensureIsArray(items) {
  return Array.isArray(items) ? items : [items];
}

export function range({ from, to, step }) {
  let actualStep = Math.abs(step || 1);
  actualStep = from <= to ? actualStep : -actualStep;

  return [...Array(Math.floor((to - from) / actualStep) + 1)].map((_, i) => from + (i * actualStep));
}

export function ensureIsUnique(items, keyFunc = item => item) {
  const result = [];
  const consumedKeys = new Set();
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const itemKey = keyFunc(item);
    if (!consumedKeys.has(itemKey)) {
      result.push(item);
      consumedKeys.add(itemKey);
    }
  }
  return result;
}

export function getSymmetricalDifference(arrayA, arrayB) {
  return [
    ...arrayA.filter(x => !arrayB.includes(x)),
    ...arrayB.filter(x => !arrayA.includes(x))
  ];
}
