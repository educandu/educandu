export const MEDIA_USAGE_KEY = {
  X: 'X', // not used anywhere
  D: 'D', // used in latest revision of public non-archived documents
  H: 'H', // used in any revision of public non-archived documents
  A: 'A', // used in any revision of public archived documents
  C: 'C', // used in document categories
  U: 'U', // used in user profiles
  S: 'S', // used in settings
  R: 'R'  // used in rooms or any revision of room documents
};

export const MEDIA_USAGE_KEYS = Object.values(MEDIA_USAGE_KEY);

export const MEDIA_USAGE_FILTER_CRITERIA_VALUE = {
  i: 'i', // indeterminate
  y: 'y', // yes
  n: 'n'  // no
};

export const MEDIA_USAGE_FILTER_CRITERIA_VALUES = Object.values(MEDIA_USAGE_FILTER_CRITERIA_VALUE);

// Converts the string represantation of a usage filter into a map
// "XnDyHyAnCnUnSnRn" -> { X: "n", D: "y", H: "y", ... }
export function usageFilterValueToUsageFilterMap(filterValue) {
  let result = Object.fromEntries(MEDIA_USAGE_KEYS.map(key => [key, MEDIA_USAGE_FILTER_CRITERIA_VALUE.i]));
  for (let index = 0; index < filterValue.length - 1; index += 2) {
    const key = filterValue[index];
    const value = filterValue[index + 1];
    if (!MEDIA_USAGE_KEY[key] || !MEDIA_USAGE_FILTER_CRITERIA_VALUE[value]) {
      throw new Error(`Invalid filter value '${filterValue}'`);
    }
    result = { ...result, [key]: value };
  }
  return result;
}

// Reverts the transformation done in `usageFilterValueToUsageFilterMap`
// { X: "n", D: "y", H: "y", ... } -> "XnDyHyAnCnUnSnRn"
export function usageFilterMapToUsageFilterValue(filterMap) {
  return MEDIA_USAGE_KEYS
    .reduce((accu, key) => {
      const criteriaValue = filterMap[key];
      if (!MEDIA_USAGE_FILTER_CRITERIA_VALUE[criteriaValue]) {
        throw new Error(`Invalid filter criteria value '${criteriaValue}'`);
      }
      return `${accu}${key}${criteriaValue}`;
    }, '');
}

// Converts the string represantation of a usage filter into a RegExp that can
// be used against the usage string of any media (library|trash) item (with usage)
// in order to test the item against a set of fine-grained usage criteria
// "XnDyHyAiCyUnSnRn" -> /^DHA?C$/
export function usageFilterValueToRegExp(filterValue) {
  const keyMap = usageFilterValueToUsageFilterMap(filterValue);
  const regExpString = MEDIA_USAGE_KEYS.reduce((accu, key) => {
    const criteriaValue = keyMap[key];
    switch (criteriaValue) {
      case MEDIA_USAGE_FILTER_CRITERIA_VALUE.i:
        return `${accu}${key}?`;
      case MEDIA_USAGE_FILTER_CRITERIA_VALUE.y:
        return `${accu}${key}`;
      case MEDIA_USAGE_FILTER_CRITERIA_VALUE.n:
        return accu;
      default:
        throw new Error(`Invalid filter value '${filterValue}'`);
    }
  }, '');

  return new RegExp(`^${regExpString}$`);
}
