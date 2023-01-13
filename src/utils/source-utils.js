import escapeStringRegexp from 'escape-string-regexp';
import { determineMediaDuration } from './media-utils.js';
import { getUrlValidationStatus, URL_VALIDATION_STATUS } from '../ui/validation.js';
import {
  SOURCE_TYPE,
  CDN_URL_PREFIX,
  ROOM_MEDIA_STORAGE_PATH_PATTERN,
  DOCUMENT_MEDIA_STORAGE_PATH_PATTERN
} from '../domain/constants.js';

export function isCdnUrl({ url = '', cdnRootUrl = '' }) {
  return (cdnRootUrl && url.startsWith(cdnRootUrl)) || url.startsWith(CDN_URL_PREFIX);
}

export function isPortableCdnUrl(url) {
  return url.startsWith(CDN_URL_PREFIX);
}

export function isCdnPath(url = '') {
  return DOCUMENT_MEDIA_STORAGE_PATH_PATTERN.test(url)
    || ROOM_MEDIA_STORAGE_PATH_PATTERN.test(url);
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

    if (DOCUMENT_MEDIA_STORAGE_PATH_PATTERN.test(cdnPath)) {
      return SOURCE_TYPE.documentMedia;
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

  if (getUrlValidationStatus(url) === URL_VALIDATION_STATUS.valid) {
    return SOURCE_TYPE.external;
  }

  return SOURCE_TYPE.unsupported;
}

export function isInternalSourceType({ url, cdnRootUrl }) {
  const sourceType = getSourceType({ url, cdnRootUrl });
  return sourceType === SOURCE_TYPE.roomMedia || sourceType === SOURCE_TYPE.documentMedia;
}

export function couldAccessUrlFromRoom(url, targetRoomId) {
  const urlOrCdnPath = getCdnPath({ url });
  const sourceRoomId = urlOrCdnPath.match(ROOM_MEDIA_STORAGE_PATH_PATTERN)?.[1];
  return !sourceRoomId || sourceRoomId === targetRoomId;
}

export async function getSourceDuration({ url, cdnRootUrl }) {
  try {
    const accessibleUrl = getAccessibleUrl({ url, cdnRootUrl });

    if (getUrlValidationStatus(url) === URL_VALIDATION_STATUS.error) {
      return 0;
    }

    const duration = await determineMediaDuration(accessibleUrl);
    return duration;
  } catch (error) {
    return 0;
  }
}
