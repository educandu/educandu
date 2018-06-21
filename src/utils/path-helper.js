function addPrefix(prefix, fileName) {
  return `${prefix}/${fileName}`;
}

function removePrefix(prefix, fileName) {
  return fileName.substr(prefix.length + 1);
}

module.exports = {
  addPrefix,
  removePrefix
};
