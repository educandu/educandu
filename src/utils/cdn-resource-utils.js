import { ensureIsUnique } from './array-utils.js';

export function consolidateCdnResourcesForSaving(rawCdnResources) {
  return ensureIsUnique(
    [...rawCdnResources]
      .map(url => typeof url === 'string' ? url.trim() : '')
      .filter(url => url)
      .map(url => decodeURI(url))
  ).sort();
}
