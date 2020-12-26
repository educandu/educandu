export function getSearchTermIndex(text, searchTerm) {
  return text.toLowerCase().indexOf(searchTerm.toLowerCase());
}

export function splitAt(text, ...indices) {
  const result = [];
  let lastIndex = 0;
  for (const index of indices) {
    result.push(text.substr(lastIndex, index - lastIndex));
    lastIndex = index;
  }
  result.push(text.substr(lastIndex));
  return result;
}

export default {
  getSearchTermIndex,
  splitAt
};
