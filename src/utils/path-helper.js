export function addPrefix(prefix, fileName) {
  return `${prefix}/${fileName}`;
}

export function removePrefix(prefix, fileName) {
  return fileName.substr(prefix.length + 1);
}

export default {
  addPrefix,
  removePrefix
};
