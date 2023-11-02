import { MEDIA_SEARCH_RESOURCE_TYPE } from '../domain/constants.js';

const MEDIA_LIBRARY_RESOURCE_TYPES = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  pdf: 'pdf',
  unknown: 'unknown'
};

export function mapMediaSearchResourceTypeToMediaLibraryResourceTypes(mediaSearchResourceType) {
  const resourceTypes = [];
  if (mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.image || mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.image);
  }
  if (mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.video || mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.video);
  }
  if (mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.audio || mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.audio);
  }
  if (mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.pdf || mediaSearchResourceType === MEDIA_SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.pdf);
  }
  if (MEDIA_SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.unknown);
  }
  return resourceTypes;
}
