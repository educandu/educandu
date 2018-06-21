function isIE() {
  return window && (window.navigator.userAgent.indexOf('MSIE') !== -1 || window.navigator.appVersion.indexOf('Trident/') > 0);
}

module.exports = {
  isIE
};
