import { SOURCE_TYPE } from './constants.js';

export function getImageSource(cdnRootUrl, sourceType, sourceUrl) {
  switch (sourceType) {
    case SOURCE_TYPE.external:
      return sourceUrl || null;
    case SOURCE_TYPE.internal:
      return sourceUrl ? `${cdnRootUrl}/${sourceUrl}` : null;
    default:
      return null;
  }
}

export function getImageDimensions(url) {
  return new Promise(resolve => {
    const img = window.document.createElement('img');
    img.onload = () => {
      const { width, height } = img;
      resolve({ width, height });
    };
    img.onabort = () => resolve(null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
