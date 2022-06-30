export const ROLE = {
  user: 'user',
  qualityManager: 'qualityManager',
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
  lesson: 'lesson',
  document: 'document'
};

export const CDN_RESOURCES_CONSOLIDATION_TASK_TYPE = {
  document: 'document',
  lesson: 'lesson'
};

export const FEATURE_TOGGLES = {
  import: 'import'
};

export const ROOM_ACCESS_LEVEL = {
  public: 'public',
  private: 'private'
};

export const ROOM_LESSONS_MODE = {
  exclusive: 'exclusive',
  collaborative: 'collaborative'
};

export const SAVE_USER_RESULT = {
  success: 'success',
  duplicateEmail: 'duplicate-email',
  duplicateUsername: 'duplicate-username'
};

export const ERROR_CODES = {
  sessionExpired: 'session-expired',
  operationCancelled: 'operation-cancelled'
};

export const DOC_VIEW_QUERY_PARAM = {
  edit: 'edit',
  history: 'history'
};

export const LESSON_VIEW_QUERY_PARAM = {
  edit: 'edit'
};

export const FAVORITE_TYPE = {
  document: 'document',
  lesson: 'lesson',
  room: 'room'
};

export const USER_ACTIVITY_TYPE = {
  documentCreated: 'document-created',
  documentUpdated: 'document-updated',
  documentMarkedFavorite: 'document-marked-favorite',
  roomCreated: 'room-created',
  roomUpdated: 'room-updated',
  roomMarkedFavorite: 'room-marked-favorite',
  roomJoined: 'room-joined',
  lessonCreated: 'lesson-created',
  lessonUpdated: 'lesson-updated',
  lessonMarkedFavorite: 'lesson-marked-favorite'
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

export const UI_LANGUAGE_COOKIE_NAME = 'UILANG';
export const LOG_LEVEL_COOKIE_NAME = 'LOG_LEVEL';
export const COOKIE_SAME_SITE_POLICY = 'lax';

export const IMAGE_OPTIMIZATION_THRESHOLD_WIDTH = 1200;
export const IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES = 500 * 1000;
export const IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES = 1.5 * 1000 * 1000;

export const STORAGE_DIRECTORY_MARKER_NAME = '__DIRMARKER__';
export const LIMIT_PER_STORAGE_UPLOAD_IN_BYTES = 250 * 1000 * 1000;

export const PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS = 24;
export const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS = 24;
export const PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS = 7;
