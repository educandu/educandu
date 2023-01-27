export function isBrowser() {
  return typeof window === 'object' && typeof document === 'object' && document.nodeType === 9;
}

export function isTouchDevice() {
  return 'ontouchstart' in window;
}

export function isMacOs() {
  return window.navigator.userAgent.includes('Macintosh');
}

export function supportsClipboardPaste() {
  return typeof window.navigator.clipboard?.readText === 'function';
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

export function getViewportMeasurementsForElement(element) {
  const elementRect = element.getBoundingClientRect();
  const viewportRect = {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight
  };

  const elementRectArea = elementRect.width * elementRect.height;
  const viewportRectArea = viewportRect.width * viewportRect.height;

  const xOverlap = Math.max(0, Math.min(viewportRect.right, elementRect.right) - Math.max(viewportRect.left, elementRect.left));
  const yOverlap = Math.max(0, Math.min(viewportRect.bottom, elementRect.bottom) - Math.max(viewportRect.top, elementRect.top));

  const overlapArea = xOverlap * yOverlap;

  // What percentage of the element is currently visible:
  const elementCoverage = overlapArea / elementRectArea;

  // What percentage of the screen is covered by the element:
  const viewportCoverage = overlapArea / viewportRectArea;

  // Is the top border of the element currently on the screen:
  const elementTopIsInViewport = elementRect.top >= viewportRect.top && elementRect.top <= viewportRect.bottom;

  return { elementCoverage, viewportCoverage, elementTopIsInViewport };
}
