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

export const ALERT_TYPE = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error'
};

export const DOCUMENT_TYPE = {
  revision: 'revision',
  document: 'document',
  permalinkedRevision: 'permalinked-revision'
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
