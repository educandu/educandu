import { SEARCH_RESOURCE_TYPE } from '../domain/constants.js';

const MEDIA_LIBRARY_RESOURCE_TYPES = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  pdf: 'pdf',
  unknown: 'unknown'
};

export function mapSearchResourceTypeToMediaLibraryResourceTypes(searchResourceType) {
  const resourceTypes = [];
  if (searchResourceType === SEARCH_RESOURCE_TYPE.image || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.image);
  }
  if (searchResourceType === SEARCH_RESOURCE_TYPE.video || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.video);
  }
  if (searchResourceType === SEARCH_RESOURCE_TYPE.audio || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.audio);
  }
  if (searchResourceType === SEARCH_RESOURCE_TYPE.pdf || searchResourceType === SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.pdf);
  }
  if (SEARCH_RESOURCE_TYPE.any) {
    resourceTypes.push(MEDIA_LIBRARY_RESOURCE_TYPES.unknown);
  }
  return resourceTypes;
}
