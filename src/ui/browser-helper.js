export function isBrowser() {
  return typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
}
