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
  documentValidation: 'document-validation',
  cdnResourcesConsolidation: 'cdn-resources-consolidation',
  cdnUploadDirectoryCreation: 'cdn-upload-directory-creation'
};

export const TASK_TYPE = {
  documentImport: 'document-import',
  documentRegeneration: 'document-regeneration',
  documentValidation: 'document-validation',
  cdnResourcesConsolidation: 'cdn-resources-consolidation',
  cdnUploadDirectoryCreation: 'cdn-upload-directory-creation'
};

export const CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE = {
  room: 'room',
  document: 'document'
};

export const FEATURE_TOGGLES = {
  import: 'import',
  comments: 'comments'
};

export const ROOM_USER_ROLE = {
  owner: 'owner',
  ownerOrCollaborator: 'ownerOrCollaborator'
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
  preview: 'preview',
  overlay: 'overlay'
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

export const MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS = 20;

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

export const DEFAULT_COLOR_SWATCHES = [
  ['#fffafa', '#ffd700', '#9ef083', '#7fff00', '#228b22', '#4582b4', '#ff0000', '#ca1515', '#800000', '#575757'],
  ['#e6f7ff', '#bae7ff', '#91d5ff', '#69c0ff', '#40a9ff', '#1890ff', '#096dd9', '#0050b3', '#003a8c', '#002766'],
  ['#f9f0ff', '#efdbff', '#d3adf7', '#b37feb', '#9254de', '#722ed1', '#531dab', '#391085', '#22075e', '#120338'],
  ['#e6fffb', '#b5f5ec', '#87e8de', '#5cdbd3', '#36cfc9', '#13c2c2', '#08979c', '#006d75', '#00474f', '#002329'],
  ['#f6ffed', '#d9f7be', '#b7eb8f', '#95de64', '#73d13d', '#52c41a', '#389e0d', '#237804', '#135200', '#092b00'],
  ['#fff0f6', '#ffd6e7', '#ffadd2', '#ff85c0', '#f759ab', '#eb2f96', '#c41d7f', '#9e1068', '#780650', '#520339'],
  ['#fff1f0', '#ffccc7', '#ffa39e', '#ff7875', '#ff4d4f', '#f5222d', '#cf1322', '#a8071a', '#820014', '#5c0011'],
  ['#fff7e6', '#ffe7ba', '#ffd591', '#ffc069', '#ffa940', '#fa8c16', '#d46b08', '#ad4e00', '#873800', '#612500'],
  ['#feffe6', '#ffffb8', '#fffb8f', '#fff566', '#ffec3d', '#fadb14', '#d4b106', '#ad8b00', '#876800', '#614700'],
  ['#fff2e8', '#ffd8bf', '#ffbb96', '#ff9c6e', '#ff7a45', '#fa541c', '#d4380d', '#ad2102', '#871400', '#610b00'],
  ['#f0f5ff', '#d6e4ff', '#adc6ff', '#85a5ff', '#597ef7', '#2f54eb', '#1d39c4', '#10239e', '#061178', '#030852'],
  ['#fcffe6', '#f4ffb8', '#eaff8f', '#d3f261', '#bae637', '#a0d911', '#7cb305', '#5b8c00', '#3f6600', '#254000'],
  ['#fffbe6', '#fff1b8', '#ffe58f', '#ffd666', '#ffc53d', '#faad14', '#d48806', '#ad6800', '#874d00', '#613400'],
  ['#ffffff', '#fafafa', '#f5f5f5', '#e8e8e8', '#d9d9d9', '#bfbfbf', '#8c8c8c', '#595959', '#262626', '#000000']
];
