export const ROLE = {
  user: 'user',
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
  documentRegeneration: 'document-regeneration'
};

export const TASK_TYPE = {
  documentImport: 'document-import',
  documentRegeneration: 'document-regeneration'
};

export const FEATURE_TOGGLES = {
  import: 'import'
};

export const ROOM_ACCESS_LEVEL = {
  public: 'public',
  private: 'private'
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

export const UI_LANGUAGE_COOKIE_NAME = 'UILANG';
export const LOG_LEVEL_COOKIE_NAME = 'LOG_LEVEL';
export const COOKIE_SAME_SITE_POLICY = 'lax';

export const IMAGE_DOWN_SCALING_WIDTH = 1200;
export const LIMIT_PER_STORAGE_UPLOAD_IN_BYTES = 250 * 1000 * 1000;
export const PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS = 24;
export const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS = 24;
export const PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS = 7;

