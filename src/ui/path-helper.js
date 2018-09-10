function getPathSegments(path) {
  return path.split('/').filter(seg => !!seg);
}

function getPrefix(segments) {
  return segments.map(s => `${s}/`).join('');
}

function isInPath(referencePathSegments, pathToTestSegments) {
  return pathToTestSegments.length <= referencePathSegments.length
    && pathToTestSegments.every((part, index) => part === referencePathSegments[index]);
}

module.exports = {
  getPathSegments,
  getPrefix,
  isInPath
};
