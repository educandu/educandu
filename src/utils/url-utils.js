import gravatar from 'gravatar';
import { AVATAR_SIZE } from '../domain/constants.js';

// Copied from: https://urlregex.com/
const URL_REGEX = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

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

function splitAtExtension(pathOrUrl) {
  const sanitizedUrl = (pathOrUrl || '').trim();
  const matches = sanitizedUrl.match(/^(.*[^/])(\.[^./]+)$/i);
  return matches
    ? { baseName: matches[1], extension: matches[2] }
    : { baseName: sanitizedUrl, extension: '' };
}

function getFileName(pathOrUrl) {
  const sanitizedUrl = (pathOrUrl || '').trim();
  return sanitizedUrl.split('/').pop();
}

function createRedirectUrl(path, redirect) {
  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}

function isFullyQualifiedUrl(pathOrUrl) {
  return (/^\w+?:\//).test(pathOrUrl);
}

function isValidUrl(url) {
  return URL_REGEX.test(url);
}

function ensureIsFullyQualifiedUrl(pathOrUrl, fallbackBase) {
  return isFullyQualifiedUrl(pathOrUrl) ? pathOrUrl : new URL(pathOrUrl, fallbackBase).href;
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
  splitAtExtension,
  getFileName,
  createRedirectUrl,
  isFullyQualifiedUrl,
  ensureIsFullyQualifiedUrl,
  getGravatarUrl,
  isValidUrl
};
