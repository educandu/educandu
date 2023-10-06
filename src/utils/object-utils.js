// Older Safari (< v15.4) needs the fallback:
const hasOwnProperty = Object.hasOwn || Object.prototype.hasOwnProperty.call;

export function ensureKeyIsExcluded(object, keyToExclude) {
  return hasOwnProperty(object, keyToExclude)
    ? Object.fromEntries(Object.entries(object).filter(([key]) => key !== keyToExclude))
    : object;
}
