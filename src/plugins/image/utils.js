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
