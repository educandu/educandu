export function getNumberFromString(string) {
  const matches = string.match(/[+-]?\d+(\.\d+)?/g);

  if (matches) {
    return parseFloat(matches[0]);
  }

  return null;
}
