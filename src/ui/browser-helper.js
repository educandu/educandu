function isBrowser() {
  return typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
}

function isIE() {
  return window && (window.navigator.userAgent.indexOf('MSIE') !== -1 || window.navigator.appVersion.indexOf('Trident/') > 0);
}

module.exports = {
  isBrowser,
  isIE
};
