
import urlUtils from './url-utils.js';
import escapeStringRegexp from 'escape-string-regexp';
import { determineMediaDuration } from './media-utils.js';
import { getWikimediaPageFromUrl } from './wikimedia-utils.js';
import {
  SOURCE_TYPE,
  CDN_URL_PREFIX,
  ROOM_MEDIA_STORAGE_PATH_PATTERN,
  MEDIA_LIBRRY_STORAGE_PATH_PATTERN
} from '../domain/constants.js';

export function isCdnUrl({ url = '', cdnRootUrl = '' }) {
  return (cdnRootUrl && url.startsWith(cdnRootUrl)) || url.startsWith(CDN_URL_PREFIX);
}

export function isPortableCdnUrl(url) {
  return url.startsWith(CDN_URL_PREFIX);
}

export function isCdnPath(path = '') {
  return MEDIA_LIBRRY_STORAGE_PATH_PATTERN.test(path) || ROOM_MEDIA_STORAGE_PATH_PATTERN.test(path);
}

export function isYoutubeSourceType(url) {
  return url.startsWith('https://www.youtube.com/') || url.startsWith('https://youtu.be/');
}

export function getCdnPath({ url = '', cdnRootUrl = '' } = { url: '', cdnRootUrl: '' }) {
  return url
    .replace(new RegExp(`^${escapeStringRegexp(cdnRootUrl)}/?`), '')
    .replace(new RegExp(`^${escapeStringRegexp(CDN_URL_PREFIX)}/?`), '');
}

export function getPortableUrl({ url = '', cdnRootUrl = '' } = { url: '', cdnRootUrl: '' }) {
  if (isCdnPath(url)) {
    return `${CDN_URL_PREFIX}${url}`;
  }
  if (isCdnUrl({ url, cdnRootUrl })) {
    return `${CDN_URL_PREFIX}${getCdnPath({ url, cdnRootUrl })}`;
  }
  return url;
}

export function getAccessibleUrl({ url = '', cdnRootUrl = '' } = { url: '', cdnRootUrl: '' }) {
  if (isCdnPath(url)) {
    return `${cdnRootUrl}/${url}`;
  }
  if (isCdnUrl({ url, cdnRootUrl })) {
    return `${cdnRootUrl}/${getCdnPath({ url, cdnRootUrl })}`;
  }
  return url;
}

export function getSourceType({ url, cdnRootUrl }) {
  if (!url) {
    return SOURCE_TYPE.none;
  }

  if (isCdnUrl({ url, cdnRootUrl }) || isCdnPath(url)) {
    const cdnPath = getCdnPath({ url, cdnRootUrl });

    if (MEDIA_LIBRRY_STORAGE_PATH_PATTERN.test(cdnPath)) {
      return SOURCE_TYPE.mediaLibrary;
    }
    if (ROOM_MEDIA_STORAGE_PATH_PATTERN.test(cdnPath)) {
      return SOURCE_TYPE.roomMedia;
    }
  }

  if (isYoutubeSourceType(url)) {
    return SOURCE_TYPE.youtube;
  }

  if (url.startsWith('https://upload.wikimedia.org/')) {
    return SOURCE_TYPE.wikimedia;
  }

  if (urlUtils.isFullyQualifiedUrl(url)) {
    return SOURCE_TYPE.external;
  }

  return SOURCE_TYPE.unsupported;
}

export function isInternalSourceType({ url, cdnRootUrl }) {
  const sourceType = getSourceType({ url, cdnRootUrl });
  return sourceType === SOURCE_TYPE.mediaLibrary || sourceType === SOURCE_TYPE.roomMedia;
}

export function couldAccessUrlFromRoom(url, targetRoomId) {
  const urlOrCdnPath = getCdnPath({ url });
  const sourceRoomId = urlOrCdnPath.match(ROOM_MEDIA_STORAGE_PATH_PATTERN)?.[1];
  return !sourceRoomId || sourceRoomId === targetRoomId;
}

export async function getSourceDuration({ url, cdnRootUrl }) {
  try {
    const accessibleUrl = getAccessibleUrl({ url, cdnRootUrl });

    if (!urlUtils.isFullyQualifiedUrl(url)) {
      return 0;
    }

    const duration = await determineMediaDuration(accessibleUrl);
    return duration;
  } catch (error) {
    return 0;
  }
}

export function createMetadataForSource({ url, cdnRootUrl }) {
  const sourceType = getSourceType({ url, cdnRootUrl });

  let copyrightLink;
  switch (sourceType) {
    case SOURCE_TYPE.youtube:
      copyrightLink = url;
      break;
    case SOURCE_TYPE.wikimedia:
      copyrightLink = getWikimediaPageFromUrl(url);
      break;
    default:
      copyrightLink = null;
      break;
  }

  return { sourceType, copyrightLink };
}

export function createCopyrightForSourceMetadata(metadata, t) {
  if (metadata.sourceType === SOURCE_TYPE.youtube && metadata.copyrightLink) {
    return t('common:youtubeCopyrightNotice', { link: metadata.copyrightLink });
  }
  if (metadata.sourceType === SOURCE_TYPE.wikimedia && metadata.copyrightLink) {
    return t('common:wikimediaCopyrightNotice', { link: metadata.copyrightLink });
  }
  return '';
}
