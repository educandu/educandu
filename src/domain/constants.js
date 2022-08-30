export const ROLE = {
  user: 'user',
  maintainer: 'maintainer',
  admin: 'admin'
};

export const DOCUMENT_ORIGIN = {
  internal: 'internal',
  external: 'external'
};

export const DOCUMENT_IMPORT_TYPE = {
  add: 'add',
  update: 'update',
  reimport: 'reimport'
};

export const BATCH_TYPE = {
  documentImport: 'document-import',
  documentRegeneration: 'document-regeneration',
  cdnResourcesConsolidation: 'cdn-resources-consolidation',
  cdnUploadDirectoryCreation: 'cdn-upload-directory-creation'
};

export const TASK_TYPE = {
  documentImport: 'document-import',
  documentRegeneration: 'document-regeneration',
  cdnResourcesConsolidation: 'cdn-resources-consolidation',
  cdnUploadDirectoryCreation: 'cdn-upload-directory-creation'
};

export const CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE = {
  room: 'room',
  document: 'document'
};

export const FEATURE_TOGGLES = {
  import: 'import'
};

export const ROOM_DOCUMENTS_MODE = {
  exclusive: 'exclusive',
  collaborative: 'collaborative'
};

export const SAVE_USER_RESULT = {
  success: 'success',
  duplicateEmail: 'duplicate-email'
};

export const ERROR_CODES = {
  sessionExpired: 'session-expired',
  operationCancelled: 'operation-cancelled'
};

export const DOC_VIEW_QUERY_PARAM = {
  edit: 'edit',
  history: 'history',
  comments: 'comments'
};

export const FAVORITE_TYPE = {
  document: 'document',
  room: 'room',
  user: 'user'
};

export const USER_ACTIVITY_TYPE = {
  documentCreated: 'document-created',
  documentUpdated: 'document-updated',
  documentMarkedFavorite: 'document-marked-favorite',
  roomCreated: 'room-created',
  roomUpdated: 'room-updated',
  roomMarkedFavorite: 'room-marked-favorite',
  roomJoined: 'room-joined',
  userMarkedFavorite: 'user-marked-favorite'
};

export const INVALID_ROOM_INVITATION_REASON = {
  token: 'token',
  room: 'room',
  user: 'user'
};

export const RESOURCE_TYPE = {
  none: 'none',
  unknown: 'unknown',
  audio: 'audio',
  video: 'video',
  image: 'image',
  text: 'text',
  pdf: 'pdf'
};

export const MEDIA_PLAY_STATE = {
  initializing: 'initializing',
  buffering: 'buffering',
  stopped: 'stopped',
  playing: 'playing',
  pausing: 'pausing'
};

export const MEDIA_ASPECT_RATIO = {
  sixteenToNine: '16:9',
  fourToThree: '4:3'
};

export const MEDIA_SCREEN_MODE = {
  none: 'none',
  audio: 'audio',
  video: 'video',
  preview: 'preview'
};

export const MEDIA_SOURCE_TYPE = {
  internal: 'internal',
  external: 'external',
  youtube: 'youtube'
};

export const IMAGE_SOURCE_TYPE = {
  internal: 'internal',
  external: 'external'
};

export const STORAGE_LOCATION_TYPE = {
  unknown: 'unknown',
  public: 'public',
  private: 'private'
};

export const CDN_OBJECT_TYPE = {
  directory: 'directory',
  file: 'file'
};

export const VERTICAL_ALIGNMENT = {
  top: 'top',
  middle: 'middle',
  bottom: 'bottom'
};

export const HORIZONTAL_ALIGNMENT = {
  left: 'left',
  center: 'center',
  right: 'right'
};

export const FILES_VIEWER_DISPLAY = {
  grid: 'grid',
  list: 'list'
};

export const DOCUMENT_ALLOWED_OPEN_CONTRIBUTION = {
  metadataAndContent: 'metadataAndContent',
  content: 'content',
  none: 'none'
};

export const DOCUMENT_VERIFIED_RELEVANCE_POINTS = 3;

export const CDN_URL_PREFIX = 'cdn://';

export const AVATAR_SIZE = 110;

export const MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS = 100;

export const UI_LANGUAGE_COOKIE_NAME = 'UILANG';
export const LOG_LEVEL_COOKIE_NAME = 'LOG_LEVEL';
export const COOKIE_SAME_SITE_POLICY = 'lax';

export const IMAGE_OPTIMIZATION_QUALITY = 0.5;
export const IMAGE_OPTIMIZATION_THRESHOLD_WIDTH = 1200;
export const IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES = 500 * 1000;
export const IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES = 1.5 * 1000 * 1000;

export const STORAGE_DIRECTORY_MARKER_NAME = '__DIRMARKER__';
export const LIMIT_PER_STORAGE_UPLOAD_IN_BYTES = 250 * 1000 * 1000;

export const PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS = 24;
export const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS = 24;
export const PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS = 7;

export const NOT_ROOM_OWNER_ERROR_MESSAGE = 'The user is not the room owner';
export const NOT_ROOM_OWNER_OR_MEMBER_ERROR_MESSAGE = 'The user is not a room owner or member';
export const NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE = 'The user is not a room owner or collaborator';
