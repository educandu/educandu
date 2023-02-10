import { RESOURCE_TYPE } from '../domain/constants.js';

export const MEDIA_LIBRARY_SEARCH_FILE_TYPE = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  pdf: 'pdf',
  other: 'other'
};

export function mapSearchFileTypesToResourceTypes(searchFileTypes) {
  return searchFileTypes.map(searchFileType => {
    switch (searchFileType) {
      case MEDIA_LIBRARY_SEARCH_FILE_TYPE.image:
        return RESOURCE_TYPE.image;
      case MEDIA_LIBRARY_SEARCH_FILE_TYPE.video:
        return RESOURCE_TYPE.video;
      case MEDIA_LIBRARY_SEARCH_FILE_TYPE.audio:
        return RESOURCE_TYPE.audio;
      case MEDIA_LIBRARY_SEARCH_FILE_TYPE.pdf:
        return RESOURCE_TYPE.pdf;
      case MEDIA_LIBRARY_SEARCH_FILE_TYPE.other:
        return RESOURCE_TYPE.unknown;
      default:
        throw new Error(`Invalid search file type '${searchFileType}'`);
    }
  });
}
