import gravatar from 'gravatar';
import { AVATAR_SIZE, IMAGE_SOURCE_TYPE, MEDIA_SOURCE_TYPE } from '../domain/constants.js';

function removeTrailingSlashes(path) {
  return String(path).replace(/\/*$/, '');
}

function removeLeadingSlashes(path) {
  return String(path).replace(/^\/*/, '');
}

function encodeURIParts(path) {
  return (path || '').split('/').map(x => encodeURIComponent(x)).join('/');
}

function composeQueryString(keyValueMap) {
  const cleanedUpKeyValuePairs = Object.entries(keyValueMap)
    .filter(([, value]) => typeof value !== 'undefined' && value !== null)
    .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value.toString()]);

  return new URLSearchParams(cleanedUpKeyValuePairs).toString();
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

function isFullyQualifiedUrl(pathOrUrl) {
  return (/^\w+?:\//).test(pathOrUrl);
}

function ensureIsFullyQualifiedUrl(pathOrUrl, fallbackBase) {
  return isFullyQualifiedUrl(pathOrUrl) ? pathOrUrl : new URL(pathOrUrl, fallbackBase).href;
}

function getImageUrl({ cdnRootUrl, sourceType, sourceUrl }) {
  switch (sourceType) {
    case IMAGE_SOURCE_TYPE.internal:
      return sourceUrl ? `${cdnRootUrl}/${sourceUrl}` : null;
    default:
      return sourceUrl || null;
  }
}

function getMediaUrl({ cdnRootUrl, sourceType, sourceUrl }) {
  switch (sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
      return sourceUrl ? `${cdnRootUrl}/${sourceUrl}` : null;
    default:
      return sourceUrl || null;
  }
}

function getGravatarUrl(userEmail) {
  return gravatar.url(userEmail, { s: AVATAR_SIZE, d: 'mp' });

}

export default {
  removeTrailingSlashes,
  removeLeadingSlashes,
  encodeURIParts,
  composeQueryString,
  createFullyQualifiedUrl,
  concatParts,
  createRedirectUrl,
  isFullyQualifiedUrl,
  ensureIsFullyQualifiedUrl,
  getImageUrl,
  getMediaUrl,
  getGravatarUrl
};
