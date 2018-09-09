const homePath = '/';
const docsPath = '/docs';
const loginPath = '/login';
const logoutPath = '/logout';
const registerPath = '/register';
const resetPasswordPath = '/reset-password';

const docsPrefix = '/docs/';
const editDocPrefix = '/edit/doc/';
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

function getDocUrl(docKey = null) {
  return docKey ? concatParts(docsPrefix, docKey) : docsPath;
}

function getEditDocUrl(docKey) {
  return concatParts(editDocPrefix, docKey);
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
  removeTrailingSlash,
  removeLeadingSlash,
  concatParts,
  getDocUrl,
  getEditDocUrl,
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
