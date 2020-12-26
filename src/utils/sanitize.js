export function toTrimmedString(value) {
  return typeof value === 'undefined' || value === null ? '' : value.toString().trim();
}

export default {
  toTrimmedString
};
