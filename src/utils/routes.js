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
const statisticsPath = '/statistics';
const resetPasswordPath = '/reset-password';
const contentManagementPath = '/content-management';
const recentContributionsPath = '/recent-contributions';
const connectExternalAccountPath = '/connect-external-account';

const apiPrefix = '/api/';
const docsPrefix = '/docs/';
const roomsPrefix = '/rooms/';
const revisionPrefix = '/revs/';
const comparisonPrefix = '/comparison/';
const userProfilePrefix = '/user-profile/';
const documentInputPrefix = '/doc-inputs/';
const mediaLibraryPrefix = '/media-library/';
const samlAuthLoginPrefix = '/saml-auth/login/';
const documentCategoriesPrefix = '/document-categories/';
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

function getDocumentInputUrl(documentInputId) {
  return urlUtils.concatParts(documentInputPrefix, documentInputId);
}

function getDocumentCategoryUrl({ id, slug }) {
  return urlUtils.concatParts(documentCategoriesPrefix, encodeURIComponent(id), urlUtils.encodeURIParts(slug));
}

function getDocumentRevisionUrl(revisionId) {
  return urlUtils.concatParts(revisionPrefix, revisionId);
}

function getDocumentRevisionComparisonUrl({ documentId, oldId, newId }) {
  const queryString = urlUtils.composeQueryString({ oldId, newId });
  return `${urlUtils.concatParts(comparisonPrefix, documentId)}?${queryString}`;
}

function getRecentContributionsUrl({ tab, page, pageSize } = {}) {
  const queryString = urlUtils.composeQueryString({ tab, page, pageSize });
  return queryString ? `${recentContributionsPath}?${queryString}` : recentContributionsPath;
}

function getContentManagementUrl(tab, params) {
  const queryString = urlUtils.composeQueryString({ tab, ...params });
  return queryString ? `${contentManagementPath}?${queryString}` : contentManagementPath;
}

function getStatisticsUrl(tab, params) {
  const queryString = urlUtils.composeQueryString({ tab, ...params });
  return queryString ? `${statisticsPath}?${queryString}` : statisticsPath;
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

function getLoginUrl({ currentUrl, suppressRedirect = false }) {
  const redirect = suppressRedirect || currentUrl === homePath ? null : currentUrl;
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

function getSearchUrl({ query, tags, type, text, sorting, direction, page, pageSize }) {
  const queryString = urlUtils.composeQueryString({
    query: (query || '').trim(),
    tags: (tags || []).filter(tag => tag).join(','),
    type,
    text: (text || '').trim(),
    sorting,
    direction,
    page,
    pageSize
  });

  return `${searchPath}?${queryString}`;
}

function getRoomUrl({ id, slug, tab } = {}) {
  const queryString = urlUtils.composeQueryString({ tab });
  const path = urlUtils.concatParts(roomsPrefix, encodeURIComponent(id), urlUtils.encodeURIParts(slug));
  return queryString ? `${path}?${queryString}` : path;
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

function getMediaLibraryItemUrl(mediaLibraryItemId) {
  return urlUtils.concatParts(mediaLibraryPrefix, mediaLibraryItemId);
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
  getContentManagementUrl,
  getStatisticsUrl,
  getDocUrl,
  getDocumentInputUrl,
  getDocumentCategoryUrl,
  getDocumentRevisionUrl,
  getDocumentRevisionComparisonUrl,
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
  getMediaLibraryItemUrl,
  getRecentContributionsUrl,
  isApiPath,
  isResetPasswordPath,
  isConnectExternalAccountPath
};
