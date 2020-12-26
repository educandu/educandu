import urlencode from 'urlencode';

export const homePath = '/';
export const docsPath = '/docs';
export const menusPath = '/menus';
export const usersPath = '/users';
export const settingsPath = '/settings';
export const loginPath = '/login';
export const logoutPath = '/logout';
export const profilePath = '/profile';
export const registerPath = '/register';
export const resetPasswordPath = '/reset-password';

export const docsPrefix = '/docs/';
export const editDocPrefix = '/edit/doc/';
export const menusPrefix = '/menus/';
export const editMenuPrefix = '/edit/menu/';
export const articlesPrefix = '/articles/';
export const articleRevisionPrefix = '/revs/articles/';
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
  return `${path}?redirect=${urlencode(redirect)}`;
}

export function getDocsUrl() {
  return docsPath;
}

export function getDocUrl(docKey) {
  return concatParts(docsPrefix, docKey);
}

export function getEditDocUrl(docKey) {
  return concatParts(editDocPrefix, docKey);
}

export function getMenusUrl() {
  return menusPath;
}

export function getMenuUrl(slug) {
  return concatParts(menusPrefix, slug);
}

export function getEditMenuUrl(menuId) {
  return concatParts(editMenuPrefix, menuId);
}

export function getUsersUrl() {
  return usersPath;
}

export function getArticleUrl(slug) {
  return concatParts(articlesPrefix, slug);
}

export function getArticleRevisionUrl(revisionId) {
  return concatParts(articleRevisionPrefix, revisionId);
}

export function getSettingsUrl() {
  return settingsPath;
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

export function getHomeUrl() {
  return homePath;
}

export function getLoginUrl(redirect = null) {
  return redirect ? createRedirectUrl(loginPath, redirect) : loginPath;
}

export function getLogoutUrl() {
  return logoutPath;
}

export function getProfileUrl() {
  return profilePath;
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

export default {
  homePath,
  docsPath,
  menusPath,
  usersPath,
  loginPath,
  logoutPath,
  registerPath,
  resetPasswordPath,
  docsPrefix,
  editDocPrefix,
  menusPrefix,
  editMenuPrefix,
  articlesPrefix,
  pluginApiPathPrefix,
  completeRegistrationPrefix,
  completePasswordResetPrefix,
  createRedirectUrl,
  removeTrailingSlash,
  removeLeadingSlash,
  concatParts,
  getMenuUrl,
  getDocsUrl,
  getDocUrl,
  getEditDocUrl,
  getMenusUrl,
  getEditMenuUrl,
  getUsersUrl,
  getArticleUrl,
  getArticleRevisionUrl,
  getSettingsUrl,
  getCompleteRegistrationUrl,
  getCompletePasswordResetUrl,
  getPluginApiPathPrefix,
  getDefaultLoginRedirectUrl,
  getDefaultLogoutRedirectUrl,
  getHomeUrl,
  getLoginUrl,
  getLogoutUrl,
  getProfileUrl,
  getRegisterUrl,
  getResetPasswordUrl,
  createFullyQualifiedUrl
};
