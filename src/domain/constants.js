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

export const UI_LANGUAGE_COOKIE_NAME = 'UILANG';
export const LOG_LEVEL_COOKIE_NAME = 'LOG_LEVEL';
export const ANNOUNCEMENT_COOKIE_NAME = 'ANNOUNCEMENT_SHOWN';
export const COOKIE_SAME_SITE_POLICY = 'lax';
