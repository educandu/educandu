function removeTrailingSlashes(path) {
  return String(path).replace(/\/*$/, '');
}

function removeLeadingSlashes(path) {
  return String(path).replace(/^\/*/, '');
}

function encodeURIParts(path) {
  return (path || '').split('/').map(x => encodeURIComponent(x)).join('/');
}

function composeQueryString(keyValuePairs) {
  return new URLSearchParams(keyValuePairs.filter(([, value]) => value)).toString();
}

function createFullyQualifiedUrl(pathname) {
  const url = new URL(document.location);
  url.pathname = pathname;
  url.search = '';
  return url.href;
}

function concatParts(...parts) {
  const nonEmptyParts = parts.map(part => part?.toString() || '').filter(part => part);
  return nonEmptyParts.length
    ? nonEmptyParts.reduce((prev, next) => `${removeTrailingSlashes(prev)}/${removeLeadingSlashes(next)}`)
    : '';
}

function createRedirectUrl(path, redirect) {
  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}

export default {
  removeTrailingSlashes,
  removeLeadingSlashes,
  encodeURIParts,
  composeQueryString,
  createFullyQualifiedUrl,
  concatParts,
  createRedirectUrl
};
