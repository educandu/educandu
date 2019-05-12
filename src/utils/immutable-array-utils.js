const swapItems = (items, index1, index2) => {
  const lastIndex = items.length - 1;
  if (index1 < 0 || index2 < 0 || index1 > lastIndex || index2 > lastIndex || index1 === index2) {
    return items;
  }

  const newItems = items.slice();
  const item1 = newItems[index1];
  const item2 = newItems[index2];
  newItems[index1] = item2;
  newItems[index2] = item1;
  return newItems;
};

const removeItem = (items, index) => {
  return items.filter((t, i) => i !== index);
};

module.exports = {
  swapItems,
  removeItem
};
