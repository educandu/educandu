export function isBrowser() {
  return typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
}

export function isTouchDevice() {
  return 'ontouchstart' in window;
}

export function isMacOs() {
  return window.navigator.userAgent.includes('Macintosh');
}

export function getCurrentUrl() {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

export function ensureFormValuesAfterHydration(antForm, fieldNames) {
  for (const fieldName of fieldNames) {
    antForm.setFieldsValue({ [fieldName]: antForm.getFieldInstance(fieldName).input.value });
  }
}
