function getPathSegments(path) {
  return path.split('/').filter(seg => !!seg);
}

function getPrefix(segments) {
  return segments.map(s => `${s}/`).join('');
}

module.exports = {
  getPathSegments,
  getPrefix
};
