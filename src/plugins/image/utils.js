import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';

export function getImageSource(cdnRootUrl, sourceType, sourceUrl) {
  switch (sourceType) {
    case IMAGE_SOURCE_TYPE.external:
      return sourceUrl || null;
    case IMAGE_SOURCE_TYPE.internal:
      return sourceUrl ? `${cdnRootUrl}/${sourceUrl}` : null;
    default:
      return null;
  }
}
