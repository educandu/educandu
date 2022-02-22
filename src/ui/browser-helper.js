export function isBrowser() {
  return typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
}

export function isMacOs() {
  return window.navigator.userAgent.includes('Macintosh');
}

export function getCurrentUrl() {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}
