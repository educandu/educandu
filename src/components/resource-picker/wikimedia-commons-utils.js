import { FILE_TYPE } from '../../api-clients/wikimedia-commons-api-client.js';

export const SEARCH_FILE_TYPE = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  pdf: 'pdf'
};

export function mapSearchFileTypesToWikimediaCommonsFileTypes(searchFileTypes) {
  return [
    ...searchFileTypes.reduce((set, searchFileType) => {
      switch (searchFileType) {
        case SEARCH_FILE_TYPE.image:
          set.add(FILE_TYPE.bitmap);
          set.add(FILE_TYPE.drawing);
          break;
        case SEARCH_FILE_TYPE.video:
          set.add(FILE_TYPE.video);
          break;
        case SEARCH_FILE_TYPE.audio:
          set.add(FILE_TYPE.audio);
          break;
        case SEARCH_FILE_TYPE.pdf:
          set.add(FILE_TYPE.pdf);
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
    .map(page => {

      return {
        pageId: page.pageid,
        displayName: page.title.replace(/^File:/, ''),
        url: page.imageinfo[0].url,
        thumbnailUrl: page.imageinfo[0].thumburl,
        updatedOn: page.touched,
        size: page.imageinfo[0].size,
        mimeType: page.imageinfo[0].mime
      };
    });

  return {
    canContinue,
    nextOffset,
    files
  };
}
