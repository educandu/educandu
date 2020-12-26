export function getPathSegments(path) {
  return path.split('/').filter(seg => !!seg);
}

export function getPrefix(segments) {
  return segments.map(s => `${s}/`).join('');
}

export function isInPath(referencePathSegments, pathToTestSegments) {
  return pathToTestSegments.length <= referencePathSegments.length
    && pathToTestSegments.every((part, index) => part === referencePathSegments[index]);
}

export default {
  getPathSegments,
  getPrefix,
  isInPath
};
