export const homePath = '/';
export const docsPath = '/docs';
export const usersPath = '/users';
export const settingsPath = '/settings';
export const importBatchesPath = '/import-batches';
export const createImportPath = '/import-batches/create';
export const loginPath = '/login';
export const logoutPath = '/logout';
export const accountPath = '/account';
export const registerPath = '/register';
export const resetPasswordPath = '/reset-password';
export const searchPath = '/search';

export const docsPrefix = '/docs/';
export const editDocPrefix = '/edit/doc/';
export const articlesPrefix = '/articles/';
export const revisionPrefix = '/revs/';
export const pluginApiPathPrefix = '/plugins/';
export const completeRegistrationPrefix = '/complete-registration/';
export const completePasswordResetPrefix = '/complete-password-reset/';

function removeTrailingSlash(path) {
  return String(path).replace(/\/*$/, '');
}

function removeLeadingSlash(path) {
  return String(path).replace(/^\/*/, '');
}

function concatParts(...parts) {
  return parts.reduce((prev, next) => `${removeTrailingSlash(prev)}/${removeLeadingSlash(next)}`);
}

export function createRedirectUrl(path, redirect) {
  return `${path}?redirect=${encodeURIComponent(redirect)}`;
}

export function getDocsUrl() {
  return docsPath;
}

export function getDocUrl(docKey) {
  return concatParts(docsPrefix, docKey);
}

export function getEditDocUrl(docKey, blueprintKey = null) {
  const url = concatParts(editDocPrefix, docKey);
  return blueprintKey ? `${url}?blueprintKey=${encodeURIComponent(blueprintKey)}` : url;
}

export function getUsersUrl() {
  return usersPath;
}

export function getArticleUrl(slug) {
  return concatParts(articlesPrefix, slug);
}

export function getDocumentRevisionUrl(revisionId) {
  return concatParts(revisionPrefix, revisionId);
}

export function getSettingsUrl() {
  return settingsPath;
}

export function getImportsUrl() {
  return importBatchesPath;
}

export function getCreateImportUrl(sourceName) {
  return `${createImportPath}?source=${encodeURIComponent(sourceName)}`;
}

export function getBatchUrl(id) {
  return concatParts(importBatchesPath, id);
}

export function getCompleteRegistrationUrl(verificationCode) {
  return concatParts(completeRegistrationPrefix, verificationCode);
}

export function getCompletePasswordResetUrl(passwordResetRequestId) {
  return concatParts(completePasswordResetPrefix, passwordResetRequestId);
}

export function getPluginApiPathPrefix(pluginType) {
  return concatParts(pluginApiPathPrefix, pluginType);
}

export function getDefaultLoginRedirectUrl() {
  return homePath;
}

export function getDefaultLogoutRedirectUrl() {
  return homePath;
}

export function getHomeUrl(language = null) {
  return language ? `${homePath}?language=${encodeURIComponent(language)}` : homePath;
}

export function getLoginUrl(redirect = null) {
  return redirect ? createRedirectUrl(loginPath, redirect) : loginPath;
}

export function getLogoutUrl() {
  return logoutPath;
}

export function getAccountUrl() {
  return accountPath;
}

export function getRegisterUrl() {
  return registerPath;
}

export function getResetPasswordUrl() {
  return resetPasswordPath;
}

export function createFullyQualifiedUrl(pathname) {
  const url = new URL(document.location);
  url.pathname = pathname;
  return url.href;
}

export function getSearchUrl(query) {
  return `${searchPath}?query=${encodeURIComponent(query)}`;
}

export function getImportSourceBaseUrl({ allowUnsecure, hostName }) {
  return `${allowUnsecure ? 'http' : 'https'}://${hostName}`;
}

export function getImportedArticleUrl({ allowUnsecure, hostName, slug }) {
  return concatParts(getImportSourceBaseUrl({ hostName, allowUnsecure }), getArticleUrl(slug));
}

export function getImportDetailsUrl(batchId) {
  return concatParts(importBatchesPath, batchId);
}

export default {
  homePath,
  docsPath,
  usersPath,
  loginPath,
  logoutPath,
  registerPath,
  resetPasswordPath,
  docsPrefix,
  editDocPrefix,
  articlesPrefix,
  pluginApiPathPrefix,
  completeRegistrationPrefix,
  completePasswordResetPrefix,
  createRedirectUrl,
  removeTrailingSlash,
  removeLeadingSlash,
  concatParts,
  getDocsUrl,
  getDocUrl,
  getEditDocUrl,
  getUsersUrl,
  getArticleUrl,
  getDocumentRevisionUrl,
  getSettingsUrl,
  getImportsUrl,
  getCreateImportUrl,
  getCompleteRegistrationUrl,
  getCompletePasswordResetUrl,
  getPluginApiPathPrefix,
  getDefaultLoginRedirectUrl,
  getDefaultLogoutRedirectUrl,
  getHomeUrl,
  getLoginUrl,
  getLogoutUrl,
  getAccountUrl,
  getRegisterUrl,
  getResetPasswordUrl,
  createFullyQualifiedUrl,
  getSearchUrl,
  getBatchUrl
};
