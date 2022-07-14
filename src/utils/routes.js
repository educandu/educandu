import urlUtils from './url-utils.js';
import escapeStringRegexp from 'escape-string-regexp';

const homePath = '/';
const docsPath = '/docs';
const adminPath = '/admin';
const usersPath = '/users';
const loginPath = '/login';
const logoutPath = '/logout';
const searchPath = '/search';
const batchesPath = '/batches';
const importsPath = '/imports';
const registerPath = '/register';
const dashboardPath = '/dashboard';
const createImportPath = '/create-import';
const resetPasswordPath = '/reset-password';

const docsPrefix = '/docs/';
const roomsPrefix = '/rooms/';
const revisionPrefix = '/revs/';
const lessonsPrefix = '/lessons/';
const completeRegistrationPrefix = '/complete-registration/';
const completePasswordResetPrefix = '/complete-password-reset/';
const roomMembershipConfirmationPrefix = '/room-membership-confirmation/';

const docPageRegex = new RegExp(`^(?:${escapeStringRegexp(docsPrefix)})([a-zA-Z0-9]+)\\b`, 'i');
const lessonPageRegex = new RegExp(`^(?:${escapeStringRegexp(lessonsPrefix)})([a-zA-Z0-9]+)\\b`, 'i');

function getDocsUrl() {
  return docsPath;
}

function getUsersUrl() {
  return usersPath;
}

function getDocUrl({ id, slug, view, templateDocumentId }) {
  const idAndSlugPart = urlUtils.concatParts(encodeURIComponent(id), urlUtils.encodeURIParts(slug));

  const url = urlUtils.concatParts(docsPrefix, idAndSlugPart);
  const queryString = urlUtils.composeQueryString([['view', view], ['templateDocumentId', templateDocumentId]]);
  return queryString ? `${url}?${queryString}` : url;
}

function getDocumentRevisionUrl(revisionId) {
  return urlUtils.concatParts(revisionPrefix, revisionId);
}

function getAdminUrl() {
  return adminPath;
}

function getImportsUrl() {
  return importsPath;
}

function getCreateImportUrl(sourceName) {
  return `${createImportPath}?source=${encodeURIComponent(sourceName)}`;
}

function getBatchUrl(id) {
  return urlUtils.concatParts(batchesPath, id);
}

function getCompleteRegistrationUrl(verificationCode) {
  return urlUtils.concatParts(completeRegistrationPrefix, verificationCode);
}

function getCompletePasswordResetUrl(passwordResetRequestId) {
  return urlUtils.concatParts(completePasswordResetPrefix, passwordResetRequestId);
}

function getRoomMembershipConfirmationUrl(token) {
  return urlUtils.concatParts(roomMembershipConfirmationPrefix, token);
}

function getDefaultLoginRedirectUrl() {
  return dashboardPath;
}

function getDefaultLogoutRedirectUrl() {
  return homePath;
}

function getHomeUrl(language = null) {
  return language ? `${homePath}?language=${encodeURIComponent(language)}` : homePath;
}

function getLoginUrl(redirect = null) {
  return redirect ? urlUtils.createRedirectUrl(loginPath, redirect) : loginPath;
}

function getLogoutUrl() {
  return logoutPath;
}

function getDashboardUrl({ tab } = {}) {
  const queryString = urlUtils.composeQueryString([['tab', tab]]);
  return queryString ? `${dashboardPath}?${queryString}` : dashboardPath;
}

function getRegisterUrl() {
  return registerPath;
}

function getResetPasswordUrl() {
  return resetPasswordPath;
}

function getSearchUrl(query) {
  return `${searchPath}?query=${encodeURIComponent((query || '').trim())}`;
}

function getImportSourceBaseUrl({ allowUnsecure, hostName }) {
  return `${allowUnsecure ? 'http' : 'https'}://${hostName}`;
}

function getImportedDocUrl({ allowUnsecure, hostName, id, slug }) {
  return urlUtils.concatParts(getImportSourceBaseUrl({ allowUnsecure, hostName }), getDocUrl({ id, slug }));
}

function getRoomUrl(id, slug) {
  return urlUtils.concatParts(roomsPrefix, encodeURIComponent(id), urlUtils.encodeURIParts(slug));
}

function getLessonUrl({ id, slug, view, templateLessonId }) {
  const url = urlUtils.concatParts(lessonsPrefix, encodeURIComponent(id), urlUtils.encodeURIParts(slug));
  const queryString = urlUtils.composeQueryString([['view', view], ['templateLessonId', templateLessonId]]);
  return queryString ? `${url}?${queryString}` : url;
}

function getDocIdIfDocUrl(url) {
  const documentId = url.match(docPageRegex)?.[1];
  return documentId || null;
}

function getLessonIdIfLessonUrl(url) {
  const lessonId = url.match(lessonPageRegex)?.[1];
  return lessonId || null;
}

export default {
  getDocsUrl,
  getUsersUrl,
  getDocUrl,
  getDocumentRevisionUrl,
  getRoomUrl,
  getAdminUrl,
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
  getDashboardUrl,
  getRegisterUrl,
  getResetPasswordUrl,
  getSearchUrl,
  getBatchUrl,
  getImportedDocUrl,
  getImportSourceBaseUrl,
  getLessonUrl,
  getDocIdIfDocUrl,
  getLessonIdIfLessonUrl
};
