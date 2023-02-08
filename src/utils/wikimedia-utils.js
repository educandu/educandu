import urlUtils from './url-utils.js';

const WIKIMEDIA_COMMONS_PAGE_URL_PREFIX = 'https://commons.wikimedia.org/wiki/File:';

export const WIKIMEDIA_COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export const WIKIMEDIA_API_FILE_TYPE = {
  bitmap: 'bitmap',
  drawing: 'drawing',
  video: 'video',
  audio: 'audio',
  pdf: 'pdf'
};

export const WIKIMEDIA_SEARCH_FILE_TYPE = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  pdf: 'pdf'
};

export function mapSearchFileTypesToApiFileTypes(searchFileTypes) {
  return [
    ...searchFileTypes.reduce((set, searchFileType) => {
      switch (searchFileType) {
        case WIKIMEDIA_SEARCH_FILE_TYPE.image:
          set.add(WIKIMEDIA_API_FILE_TYPE.bitmap);
          set.add(WIKIMEDIA_API_FILE_TYPE.drawing);
          break;
        case WIKIMEDIA_SEARCH_FILE_TYPE.video:
          set.add(WIKIMEDIA_API_FILE_TYPE.video);
          break;
        case WIKIMEDIA_SEARCH_FILE_TYPE.audio:
          set.add(WIKIMEDIA_API_FILE_TYPE.audio);
          break;
        case WIKIMEDIA_SEARCH_FILE_TYPE.pdf:
          set.add(WIKIMEDIA_API_FILE_TYPE.pdf);
          break;
        default:
          throw new Error(`Invalid search file type '${searchFileType}'`);
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
      displayName: page.title.replace(/^File:/, ''),
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
