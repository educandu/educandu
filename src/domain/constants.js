export const ROLE = {
  user: 'user',
  accreditedAuthor: 'accredited-author',
  editor: 'editor',
  maintainer: 'maintainer',
  admin: 'admin'
};

export const EVENT_TYPE = {
  documentRevisionCreated: 'document-revision-created',
  documentCommentCreated: 'document-comment-created',
  roomMessageCreated: 'room-message-created',
  documentInputCreated: 'document-input-created',
  documentInputCommentCreated: 'document-input-comment-created'
};

export const NOTIFICATION_REASON = {
  roomMembership: 'room-membership',
  roomFavorite: 'room-favorite',
  documentFavorite: 'document-favorite',
  userFavorite: 'user-favorite',
  documentInputAuthor: 'document-input-author'
};

export const BATCH_TYPE = {
  documentRegeneration: 'document-regeneration',
  documentValidation: 'document-validation',
  cdnResourcesConsolidation: 'cdn-resources-consolidation'
};

export const TASK_TYPE = {
  documentRegeneration: 'document-regeneration',
  documentValidation: 'document-validation',
  cdnResourcesConsolidation: 'cdn-resources-consolidation'
};

export const CDN_RESOURCES_CONSOLIDATION_TYPE = {
  document: 'document',
  documentCategory: 'document-category',
  room: 'room',
  user: 'user',
  setting: 'setting'
};

export const FEATURE_TOGGLES = {
};

export const ROOM_USER_ROLE = {
  owner: 'owner',
  ownerOrMember: 'ownerOrMember',
  ownerOrCollaborator: 'ownerOrCollaborator'
};

export const SAVE_USER_RESULT = {
  success: 'success',
  duplicateEmail: 'duplicate-email'
};

export const ERROR_CODES = {
  userAccountLocked: 'user-account-locked',
  sessionExpired: 'session-expired',
  operationCancelled: 'operation-cancelled'
};

export const DOC_VIEW_QUERY_PARAM = {
  edit: 'edit',
  history: 'history',
  comments: 'comments',
  inputs: 'inputs'
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

export const EMAIL_NOTIFICATION_FREQUENCY = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  never: 'never'
};

export const INVALID_ROOM_INVITATION_REASON = {
  token: 'token',
  room: 'room',
  differenUser: 'different-user',
  unconfirmedUser: 'unconfirmed-user'
};

export const RESOURCE_TYPE = {
  none: 'none',
  unknown: 'unknown',
  audio: 'audio',
  video: 'video',
  image: 'image',
  pdf: 'pdf'
};

export const MEDIA_SEARCH_RESOURCE_TYPE = {
  ...RESOURCE_TYPE,
  any: 'any'
};

export const SEARCH_RESOURCE_TYPE = {
  ...MEDIA_SEARCH_RESOURCE_TYPE,
  document: 'document'
};

export const MEDIA_ASPECT_RATIO = {
  sixteenToNine: '16:9',
  fourToThree: '4:3'
};

export const EXTENDED_ASPECT_RATIO = {
  fifteenToOne: '15:1',
  tenToOne: '10:1',
  sevenToOne: '7:1',
  fiveToOne: '5:1',
  threeToOne: '3:1',
  sevenToThree: '7:3',
  sixteenToNine: '16:9',
  threeToTwo: '3:2',
  fourToThree: '4:3',
  fiveToFour: '5:4',
  sixToFive: '6:5',
  oneToOne: '1:1'
};

export const MULTITRACK_PLAYER_TYPE = {
  default: 'default',
  precise: 'precise'
};

export const MEDIA_SCREEN_MODE = {
  none: 'none',
  audio: 'audio',
  video: 'video'
};

export const SOURCE_TYPE = {
  none: 'none',
  youtube: 'youtube',
  external: 'external',
  mediaLibrary: 'media-library',
  wikimedia: 'wikimedia',
  roomMedia: 'room-media',
  unsupported: 'unsupported'
};

export const STORAGE_LOCATION_TYPE = {
  unknown: 'unknown',
  roomMedia: 'room-media',
  mediaLibrary: 'media-library'
};

export const DASHBOARD_TAB_KEY = {
  activities: 'activities',
  favorites: 'favorites',
  documents: 'documents',
  rooms: 'rooms',
  documentInputs: 'document-inputs',
  notifications: 'notifications',
  storage: 'storage',
  settings: 'settings'
};

export const ORIENTATION = {
  vertical: 'vertical',
  horizontal: 'horizontal'
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

export const SAVE_DOCUMENT_CATEGORY_RESULT = {
  success: 'success',
  duplicateName: 'duplicate-name'
};

export const DAY_OF_WEEK = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

export const FORM_ITEM_LAYOUT = {
  labelCol: {
    sm: { span: 6, offset: 0 },
    md: { span: 5, offset: 1 },
    lg: { span: 4, offset: 2 }
  },
  wrapperCol: {
    sm: { span: 17 },
    md: { span: 16 },
    lg: { span: 15 }
  }
};

export const FORM_ITEM_LAYOUT_WITHOUT_LABEL = {
  wrapperCol: {
    sm: {
      span: FORM_ITEM_LAYOUT.wrapperCol.sm.span,
      offset: FORM_ITEM_LAYOUT.labelCol.sm.span + FORM_ITEM_LAYOUT.labelCol.sm.offset
    },
    md: {
      span: FORM_ITEM_LAYOUT.wrapperCol.md.span,
      offset: FORM_ITEM_LAYOUT.labelCol.md.span + FORM_ITEM_LAYOUT.labelCol.md.offset
    },
    lg: {
      span: FORM_ITEM_LAYOUT.wrapperCol.lg.span,
      offset: FORM_ITEM_LAYOUT.labelCol.lg.span + FORM_ITEM_LAYOUT.labelCol.lg.offset
    }
  }
};

export const ADMIN_PAGE_FORM_ITEM_LAYOUT = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export const FORM_ITEM_LAYOUT_VERTICAL = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export const MAX_SEARCH_QUERY_LENGTH = 250;

export const PARTIAL_SEARCH_THRESHOLD = 3;

export const DOCUMENT_VERIFIED_RELEVANCE_POINTS = 3;

export const CDN_URL_PREFIX = 'cdn://';

export const AVATAR_SIZE = 110;
export const AVATAR_SIZE_BIG = 140;

export const MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS = 20;

export const UI_LANGUAGE_COOKIE_NAME = 'UILANG';
export const LOG_LEVEL_COOKIE_NAME = 'LOG_LEVEL';
export const COOKIE_SAME_SITE_POLICY = 'lax';

export const IMAGE_OPTIMIZATION_QUALITY = 0.5;
export const IMAGE_OPTIMIZATION_THRESHOLD_WIDTH = 1200;
export const IMAGE_OPTIMIZATION_MAX_SIZE_OVER_THRESHOLD_WIDTH_IN_BYTES = 500 * 1000;
export const IMAGE_OPTIMIZATION_MAX_SIZE_UNDER_THRESHOLD_WIDTH_IN_BYTES = 1.5 * 1000 * 1000;

export const STORAGE_DIRECTORY_MARKER_NAME = '__DIRMARKER__';
export const STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES = 250 * 1000 * 1000;
export const STORAGE_FILE_UPLOAD_COUNT_LIMIT = 10;

export const PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES = 15;
export const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES = 15;
export const PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS = 7;

export const ANTI_BRUTE_FORCE_MAX_REQUESTS = 60;
export const ANTI_BRUTE_FORCE_EXPIRES_IN_MS = 60 * 60 * 1000;

export const NOTIFICATION_EXPIRATION_IN_MONTHS = 2;
export const CONTACT_REQUEST_EXPIRATION_IN_DAYS = 5;

export const MEDIA_TRASH_CLEANUP_CRON_PATTERN = '0 4 * * *'; // every day at 4am

export const EMAIL_NOTIFICATION_SENDER_CRON_PATTERN = '0 20 * * *'; // every day at 8pm
export const EMAIL_NOTIFICATION_DUE_DAY_OF_WEEK = 1;
export const EMAIL_NOTIFICATION_DUE_DAY_OF_MONTH = 1;

export const NOT_ROOM_OWNER_ERROR_MESSAGE = 'The user is not the room owner';
export const NOT_ROOM_OWNER_OR_MEMBER_ERROR_MESSAGE = 'The user is not a room owner or member';
export const NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE = 'The user is not a room owner or collaborator';

export const MEDIA_LIBRRY_STORAGE_PATH_PATTERN = /^media-library(\/.*)?$/;
export const ROOM_MEDIA_STORAGE_PATH_PATTERN = /^room-media\/([^/]+)(\/.*)?$/;

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

export const DEFAULT_COLOR_PICKER_WIDTH = 382;

export const HTTP_STATUS = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  tooManyRequests: 429,
  internalServerError: 500
};

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

export const LOADING_SPINNER_MINIMUM_PERIOD_IN_MILLISECONDS = 1000;

export const MEDIA_PLAYBACK_RATES = [0.25, 0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];

export const DEFAULT_MEDIA_PLAYBACK_RATE = 1;

export const PLUGIN_GROUP = {
  mostUsed: 'most-used',
  textImage: 'text-image',
  audioVideo: 'audio-video',
  userInput: 'user-input',
  interactive: 'interactive',
  other: 'other'
};

export const SORTING_DIRECTION = {
  asc: 'asc',
  desc: 'desc'
};
