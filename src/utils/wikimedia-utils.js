import urlUtils from './url-utils.js';
import { SEARCH_RESOURCE_TYPE } from '../domain/constants.js';

const WIKIMEDIA_COMMONS_PAGE_URL_PREFIX = 'https://commons.wikimedia.org/wiki/File:';

export const WIKIMEDIA_COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export const WIKIMEDIA_API_FILE_TYPE = {
  bitmap: 'bitmap',
  drawing: 'drawing',
  video: 'video',
  audio: 'audio',
  pdf: 'pdf'
};

export function mapSearchResourceTypeToWikimediaApiFileTypes(searchResourceType) {
  const fileTypes = [];
  if (searchResourceType === SEARCH_RESOURCE_TYPE.image || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    fileTypes.push(WIKIMEDIA_API_FILE_TYPE.bitmap);
    fileTypes.push(WIKIMEDIA_API_FILE_TYPE.drawing);
  }
  if (searchResourceType === SEARCH_RESOURCE_TYPE.video || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    fileTypes.push(WIKIMEDIA_API_FILE_TYPE.video);
  }
  if (searchResourceType === SEARCH_RESOURCE_TYPE.audio || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    fileTypes.push(WIKIMEDIA_API_FILE_TYPE.audio);
  }
  if (searchResourceType === SEARCH_RESOURCE_TYPE.pdf || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    fileTypes.push(WIKIMEDIA_API_FILE_TYPE.pdf);
  }
  return fileTypes;
}

export function processWikimediaResponse(responseData) {
  const continueEntry = responseData.continue?.continue ?? '';
  const nextOffset = responseData.continue?.gsroffset ?? -1;
  const canContinue = continueEntry.includes('gsroffset')
    && typeof nextOffset === 'number'
    && nextOffset > 0;

  const files = Object.values(responseData.query?.pages || {})
    .filter(page => page.imageinfo?.length)
    .map(page => ({
      pageId: page.pageid,
      pageUrl: page.canonicalurl,
      name: page.title.replace(/^File:/, ''),
      url: page.imageinfo[0].url,
      thumbnailUrl: page.imageinfo[0].thumburl,
      updatedOn: page.touched,
      size: page.imageinfo[0].size,
      mimeType: page.imageinfo[0].mime
    }));

  return {
    canContinue,
    nextOffset,
    files
  };
}

export function getWikimediaPageFromUrl(url) {
  return `${WIKIMEDIA_COMMONS_PAGE_URL_PREFIX}${urlUtils.getFileName(url)}`;
}
