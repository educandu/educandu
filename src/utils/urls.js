const homePath = '/';
const docsPath = '/docs';
const menusPath = '/menus';
const loginPath = '/login';
const logoutPath = '/logout';
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

function getIndexPageUrls(category) {
  return concatParts(menusPrefix, category.toLowerCase());
}

function getDocUrl(docKey = null) {
  return docKey ? concatParts(docsPrefix, docKey) : docsPath;
}

function getEditDocUrl(docKey) {
  return concatParts(editDocPrefix, docKey);
}

function getMenusUrl() {
  return menusPath;
}

function getEditMenuUrl(menuId) {
  return concatParts(editMenuPrefix, menuId);
}

function getArticleUrl(slug) {
  return concatParts(articlesPrefix, slug);
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

function getLoginUrl() {
  return loginPath;
}

function getLogoutUrl() {
  return logoutPath;
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
  removeTrailingSlash,
  removeLeadingSlash,
  concatParts,
  getIndexPageUrls,
  getDocUrl,
  getEditDocUrl,
  getMenusUrl,
  getEditMenuUrl,
  getArticleUrl,
  getCompleteRegistrationUrl,
  getCompletePasswordResetUrl,
  getPluginApiPathPrefix,
  getDefaultLoginRedirectUrl,
  getDefaultLogoutRedirectUrl,
  getHomeUrl,
  getLoginUrl,
  getLogoutUrl,
  getRegisterUrl,
  getResetPasswordUrl
};
