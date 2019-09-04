const urlencode = require('urlencode');

const homePath = '/';
const docsPath = '/docs';
const menusPath = '/menus';
const usersPath = '/users';
const settingsPath = '/settings';
const loginPath = '/login';
const logoutPath = '/logout';
const profilePath = '/profile';
const registerPath = '/register';
const resetPasswordPath = '/reset-password';

const docsPrefix = '/docs/';
const editDocPrefix = '/edit/doc/';
const menusPrefix = '/menus/';
const editMenuPrefix = '/edit/menu/';
const articlesPrefix = '/articles/';
const pluginApiPathPrefix = '/plugins/';
const completeRegistrationPrefix = '/complete-registration/';
const completePasswordResetPrefix = '/complete-password-reset/';

function removeTrailingSlash(path) {
  return String(path).replace(/\/*$/, '');
}

function removeLeadingSlash(path) {
  return String(path).replace(/^\/*/, '');
}

function concatParts(...parts) {
  return parts.reduce((prev, next) => `${removeTrailingSlash(prev)}/${removeLeadingSlash(next)}`);
}

function createRedirectUrl(path, redirect) {
  return `${path}?redirect=${urlencode(redirect)}`;
}

function getDocsUrl() {
  return docsPath;
}

function getDocUrl(docKey) {
  return concatParts(docsPrefix, docKey);
}

function getEditDocUrl(docKey) {
  return concatParts(editDocPrefix, docKey);
}

function getMenusUrl() {
  return menusPath;
}

function getMenuUrl(slug) {
  return concatParts(menusPrefix, slug);
}

function getEditMenuUrl(menuId) {
  return concatParts(editMenuPrefix, menuId);
}

function getUsersUrl() {
  return usersPath;
}

function getArticleUrl(slug) {
  return concatParts(articlesPrefix, slug);
}

function getSettingsUrl() {
  return settingsPath;
}

function getCompleteRegistrationUrl(verificationCode) {
  return concatParts(completeRegistrationPrefix, verificationCode);
}

function getCompletePasswordResetUrl(passwordResetRequestId) {
  return concatParts(completePasswordResetPrefix, passwordResetRequestId);
}

function getPluginApiPathPrefix(pluginType) {
  return concatParts(pluginApiPathPrefix, pluginType);
}

function getDefaultLoginRedirectUrl() {
  return homePath;
}

function getDefaultLogoutRedirectUrl() {
  return homePath;
}

function getHomeUrl() {
  return homePath;
}

function getLoginUrl(redirect = null) {
  return redirect ? createRedirectUrl(loginPath, redirect) : loginPath;
}

function getLogoutUrl() {
  return logoutPath;
}

function getProfileUrl() {
  return profilePath;
}

function getRegisterUrl() {
  return registerPath;
}

function getResetPasswordUrl() {
  return resetPasswordPath;
}

module.exports = {
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
  getResetPasswordUrl
};
