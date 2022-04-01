export function isBrowser() {
  return typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
}

export function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
}

export function isMacOs() {
  return window.navigator.userAgent.includes('Macintosh');
}

export function getCurrentUrl() {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}
