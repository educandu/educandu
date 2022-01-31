const homePath = '/';
const docsPath = '/docs';
const usersPath = '/users';
const loginPath = '/login';
const logoutPath = '/logout';
const searchPath = '/search';
const mySpacePath = '/my-space';
const registerPath = '/register';
const settingsPath = '/settings';
const importBatchesPath = '/import-batches';
const resetPasswordPath = '/reset-password';
const createImportPath = '/import-batches/create';

const docsPrefix = '/docs/';
const roomsPrefix = '/rooms/';
const revisionPrefix = '/revs/';
const lessonsPrefix = '/lessons/';
const completeRegistrationPrefix = '/complete-registration/';
const completePasswordResetPrefix = '/complete-password-reset/';
const roomMembershipConfirmationPrefix = '/room-membership-confirmation/';

function removeTrailingSlash(path) {
  return String(path).replace(/\/*$/, '');
}

function removeLeadingSlash(path) {
  return String(path).replace(/^\/*/, '');
}

function encodeURIParts(path) {
  return (path || '').split('/').map(x => encodeURIComponent(x)).join('/');
}

function concatParts(...parts) {
  return parts
    .filter(part => part || part === 0 || part === false)
    .reduce((prev, next) => `${removeTrailingSlash(prev)}/${removeLeadingSlash(next)}`);
}

function createRedirectUrl(path, redirect) {
  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}

function getDocsUrl() {
  return docsPath;
}

function getUsersUrl() {
  return usersPath;
}

function getDocUrl({ key, slug, view, templateDocumentKey }) {
  const url = concatParts(docsPrefix, encodeURIComponent(key), encodeURIParts(slug));
  const queryParams = new URLSearchParams([['view', view], ['templateDocumentKey', templateDocumentKey]].filter(([, value]) => value)).toString();
  return queryParams ? `${url}?${queryParams}` : url;
}

function getDocumentRevisionUrl(revisionId) {
  return concatParts(revisionPrefix, revisionId);
}

function getSettingsUrl() {
  return settingsPath;
}

function getImportsUrl() {
  return importBatchesPath;
}

function getCreateImportUrl(sourceName) {
  return `${createImportPath}?source=${encodeURIComponent(sourceName)}`;
}

function getBatchUrl(id) {
  return concatParts(importBatchesPath, id);
}

function getCompleteRegistrationUrl(verificationCode) {
  return concatParts(completeRegistrationPrefix, verificationCode);
}

function getCompletePasswordResetUrl(passwordResetRequestId) {
  return concatParts(completePasswordResetPrefix, passwordResetRequestId);
}

function getRoomMembershipConfirmationUrl(token) {
  return concatParts(roomMembershipConfirmationPrefix, token);
}

function getDefaultLoginRedirectUrl() {
  return homePath;
}

function getDefaultLogoutRedirectUrl() {
  return homePath;
}

function getHomeUrl(language = null) {
  return language ? `${homePath}?language=${encodeURIComponent(language)}` : homePath;
}

function getLoginUrl(redirect = null) {
  return redirect ? createRedirectUrl(loginPath, redirect) : loginPath;
}

function getLogoutUrl() {
  return logoutPath;
}

function getMySpaceUrl() {
  return mySpacePath;
}

function getRegisterUrl() {
  return registerPath;
}

function getResetPasswordUrl() {
  return resetPasswordPath;
}

function createFullyQualifiedUrl(pathname) {
  const url = new URL(document.location);
  url.pathname = pathname;
  return url.href;
}

function getSearchUrl(query) {
  return `${searchPath}?query=${encodeURIComponent(query)}`;
}

function getImportSourceBaseUrl({ allowUnsecure, hostName }) {
  return `${allowUnsecure ? 'http' : 'https'}://${hostName}`;
}

function getImportedDocUrl({ allowUnsecure, hostName, key, slug }) {
  return concatParts(getImportSourceBaseUrl({ hostName, allowUnsecure }), getDocUrl(key, slug));
}

function getImportDetailsUrl(batchId) {
  return concatParts(importBatchesPath, batchId);
}

function getRoomUrl(id, slug) {
  return concatParts(roomsPrefix, encodeURIComponent(id), encodeURIParts(slug));
}

function getLessonUrl(id, slug) {
  return concatParts(lessonsPrefix, encodeURIComponent(id), encodeURIParts(slug));
}

export default {
  docsPrefix,
  createRedirectUrl,
  removeTrailingSlash,
  removeLeadingSlash,
  concatParts,
  getDocsUrl,
  getUsersUrl,
  getDocUrl,
  getDocumentRevisionUrl,
  getRoomUrl,
  getSettingsUrl,
  getImportsUrl,
  getCreateImportUrl,
  getCompleteRegistrationUrl,
  getCompletePasswordResetUrl,
  getRoomMembershipConfirmationUrl,
  getDefaultLoginRedirectUrl,
  getDefaultLogoutRedirectUrl,
  getHomeUrl,
  getLoginUrl,
  getLogoutUrl,
  getMySpaceUrl,
  getRegisterUrl,
  getResetPasswordUrl,
  createFullyQualifiedUrl,
  getSearchUrl,
  getBatchUrl,
  getImportedDocUrl,
  getImportDetailsUrl,
  getImportSourceBaseUrl,
  getLessonUrl
};
