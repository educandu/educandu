import urlUtils from './url-utils.js';
import escapeStringRegexp from 'escape-string-regexp';

const homePath = '/';
const adminPath = '/admin';
const loginPath = '/login';
const logoutPath = '/logout';
const searchPath = '/search';
const batchesPath = '/batches';
const registerPath = '/register';
const dashboardPath = '/dashboard';
const redactionPath = '/redaction';
const resetPasswordPath = '/reset-password';
const connectExternalAccountPath = '/connect-external-account';

const apiPrefix = '/api/';
const docsPrefix = '/docs/';
const roomsPrefix = '/rooms/';
const revisionPrefix = '/revs/';
const userProfilePrefix = '/user-profile/';
const samlAuthLoginPrefix = '/saml-auth/login/';
const samlAuthLoginCallbackPrefix = '/saml-auth/login-callback/';
const roomMembershipConfirmationPrefix = '/room-membership-confirmation/';

const docPageRegex = new RegExp(`^(?:${escapeStringRegexp(docsPrefix)})([a-zA-Z0-9]+)\\b`, 'i');

function getUserProfileUrl(id) {
  return urlUtils.concatParts(userProfilePrefix, encodeURIComponent(id));
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

function getRedactionUrl({ tab } = {}) {
  const queryString = urlUtils.composeQueryString({ tab });
  return queryString ? `${redactionPath}?${queryString}` : redactionPath;
}

function getAdminUrl({ tab } = {}) {
  const queryString = urlUtils.composeQueryString({ tab });
  return queryString ? `${adminPath}?${queryString}` : adminPath;
}

function getBatchUrl(id) {
  return urlUtils.concatParts(batchesPath, id);
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

function getConnectExternalAccountPath(redirect = null) {
  return redirect ? urlUtils.createRedirectUrl(connectExternalAccountPath, redirect) : connectExternalAccountPath;
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

function getSamlAuthLoginPath(providerKey, redirect = null) {
  const fullPath = urlUtils.concatParts(samlAuthLoginPrefix, encodeURIComponent(providerKey));
  return redirect ? urlUtils.createRedirectUrl(fullPath, redirect) : fullPath;
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

function isConnectExternalAccountPath(path) {
  return path === connectExternalAccountPath;
}

export default {
  getUserProfileUrl,
  getRedactionUrl,
  getDocUrl,
  getDocumentRevisionUrl,
  getRoomUrl,
  getAdminUrl,
  getRoomMembershipConfirmationUrl,
  getDefaultLoginRedirectUrl,
  getDefaultLogoutRedirectUrl,
  getHomeUrl,
  getLoginUrl,
  getLogoutUrl,
  getDashboardUrl,
  getRegisterUrl,
  getResetPasswordUrl,
  getConnectExternalAccountPath,
  getSearchUrl,
  getBatchUrl,
  getDocIdIfDocUrl,
  getSamlAuthLoginPath,
  getSamlAuthLoginCallbackPath,
  isApiPath,
  isResetPasswordPath,
  isConnectExternalAccountPath
};
