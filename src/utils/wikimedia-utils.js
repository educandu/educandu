import urlUtils from './url-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';

const WIKIMEDIA_COMMONS_PAGE_URL_PREFIX = 'https://commons.wikimedia.org/wiki/File:';

export const WIKIMEDIA_COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export const ALLOWED_WIKIMEDIA_RESOURCE_TYPES = [
  RESOURCE_TYPE.image,
  RESOURCE_TYPE.audio,
  RESOURCE_TYPE.video,
  RESOURCE_TYPE.pdf
];

export const WIKIMEDIA_API_FILE_TYPE = {
  bitmap: 'bitmap',
  drawing: 'drawing',
  video: 'video',
  audio: 'audio',
  pdf: 'pdf'
};

export function mapResourceTypesToWikimediaApiFileTypes(resourceTypes) {
  return [
    ...resourceTypes.reduce((set, searchResourceType) => {
      switch (searchResourceType) {
        case RESOURCE_TYPE.image:
          set.add(WIKIMEDIA_API_FILE_TYPE.bitmap);
          set.add(WIKIMEDIA_API_FILE_TYPE.drawing);
          break;
        case RESOURCE_TYPE.video:
          set.add(WIKIMEDIA_API_FILE_TYPE.video);
          break;
        case RESOURCE_TYPE.audio:
          set.add(WIKIMEDIA_API_FILE_TYPE.audio);
          break;
        case RESOURCE_TYPE.pdf:
          set.add(WIKIMEDIA_API_FILE_TYPE.pdf);
          break;
        default:
          throw new Error(`Invalid search file type '${searchResourceType}'`);
      }
      return set;
    }, new Set())
  ];
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
