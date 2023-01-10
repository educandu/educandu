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
const registerPath = '/register';
const dashboardPath = '/dashboard';
const resetPasswordPath = '/reset-password';
const linkExternalAccountPath = '/link-external-account';

const apiPrefix = '/api/';
const docsPrefix = '/docs/';
const usersPrefix = '/users/';
const roomsPrefix = '/rooms/';
const revisionPrefix = '/revs/';
const samlAuthLoginPrefix = '/saml-auth/login/';
const completeRegistrationPrefix = '/complete-registration/';
const completePasswordResetPrefix = '/complete-password-reset/';
const samlAuthLoginCallbackPrefix = '/saml-auth/login-callback/';
const roomMembershipConfirmationPrefix = '/room-membership-confirmation/';

const docPageRegex = new RegExp(`^(?:${escapeStringRegexp(docsPrefix)})([a-zA-Z0-9]+)\\b`, 'i');

function getDocsUrl() {
  return docsPath;
}

function getUsersUrl() {
  return usersPath;
}

function getUserUrl(id) {
  return urlUtils.concatParts(usersPrefix, encodeURIComponent(id));
}

function getDocUrl({ id, slug, view, templateDocumentId }) {
  const idAndSlugPart = urlUtils.concatParts(encodeURIComponent(id), urlUtils.encodeURIParts(slug));

  const url = urlUtils.concatParts(docsPrefix, idAndSlugPart);
  const queryString = urlUtils.composeQueryString({ view, templateDocumentId });
  return queryString ? `${url}?${queryString}` : url;
}

function getDocumentRevisionUrl(revisionId) {
  return urlUtils.concatParts(revisionPrefix, revisionId);
}

function getAdminUrl({ tab } = {}) {
  const queryString = urlUtils.composeQueryString({ tab });
  return queryString ? `${adminPath}?${queryString}` : adminPath;
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
  const queryString = urlUtils.composeQueryString({ tab });
  return queryString ? `${dashboardPath}?${queryString}` : dashboardPath;
}

function getRegisterUrl() {
  return registerPath;
}

function getResetPasswordUrl() {
  return resetPasswordPath;
}

function getLinkExternalAccountPath() {
  return linkExternalAccountPath;
}

function getSearchUrl(query) {
  return `${searchPath}?query=${encodeURIComponent((query || '').trim())}`;
}

function getRoomUrl(id, slug) {
  return urlUtils.concatParts(roomsPrefix, encodeURIComponent(id), urlUtils.encodeURIParts(slug));
}

function getDocIdIfDocUrl(url) {
  const documentId = url.match(docPageRegex)?.[1];
  return documentId || null;
}

function getSamlAuthLoginPath(providerKey) {
  return urlUtils.concatParts(samlAuthLoginPrefix, encodeURIComponent(providerKey));
}

function getSamlAuthLoginCallbackPath(providerKey) {
  return urlUtils.concatParts(samlAuthLoginCallbackPrefix, encodeURIComponent(providerKey));
}

function isApiPath(path) {
  return path.startsWith(apiPrefix);
}

function isResetPasswordPath(path) {
  return path === resetPasswordPath;
}

function isLinkExternalAccountPath(path) {
  return path === linkExternalAccountPath;
}

function isCompleteRegistrationPath(path) {
  return path.startsWith(completeRegistrationPrefix);
}

function isCompletePasswordResetPrefixPath(path) {
  return path.startsWith(completePasswordResetPrefix);
}

export default {
  getUserUrl,
  getDocsUrl,
  getUsersUrl,
  getDocUrl,
  getDocumentRevisionUrl,
  getRoomUrl,
  getAdminUrl,
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
  getLinkExternalAccountPath,
  getSearchUrl,
  getBatchUrl,
  getDocIdIfDocUrl,
  getSamlAuthLoginPath,
  getSamlAuthLoginCallbackPath,
  isApiPath,
  isResetPasswordPath,
  isLinkExternalAccountPath,
  isCompleteRegistrationPath,
  isCompletePasswordResetPrefixPath
};
