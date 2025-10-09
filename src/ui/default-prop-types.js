import PropTypes from 'prop-types';
import { isBrowser } from './browser-helper.js';
import { PAGE_NAME } from '../domain/page-name.js';
import {
  BATCH_TYPE,
  TASK_TYPE,
  USER_ACTIVITY_TYPE,
  RESOURCE_TYPE,
  EVENT_TYPE,
  CDN_RESOURCES_CONSOLIDATION_TYPE
} from '../domain/constants.js';

const File = isBrowser() ? window.File : class File {};

export const browserFileType = PropTypes.instanceOf(File);

export const samlIdentityProviderClientShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  logoUrl: PropTypes.string
});

export const sectionContextShape = PropTypes.shape({
  isPreview: PropTypes.bool.isRequired
});

export const sectionDisplayProps = {
  context: sectionContextShape.isRequired,
  content: PropTypes.any,
  input: PropTypes.any,
  canModifyInput: PropTypes.bool.isRequired,
  onInputChanged: PropTypes.func.isRequired
};

export const sectionEditorProps = {
  context: sectionContextShape.isRequired,
  content: PropTypes.any,
  onContentChanged: PropTypes.func.isRequired
};

export const clientConfigProps = {
  clientConfig: PropTypes.shape({
    cdnRootUrl: PropTypes.string.isRequired,
    disabledFeatures: PropTypes.arrayOf(PropTypes.string).isRequired,
    consentCookieNamePrefix: PropTypes.string.isRequired,
    uploadLiabilityCookieName: PropTypes.string.isRequired,
    announcementCookieNamePrefix: PropTypes.string.isRequired
  }).isRequired
};

export const requestProps = {
  request: PropTypes.shape({
    ip: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    protocol: PropTypes.string.isRequired,
    originalUrl: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
    hostInfo: PropTypes.shape({
      proto: PropTypes.string.isRequired,
      host: PropTypes.string.isRequired,
      origin: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

const settingsDocumentProps = {
  linkTitle: PropTypes.string,
  documentId: PropTypes.string
};

export const settingsDocumentShape = PropTypes.shape(settingsDocumentProps);

const settingsLicenseProps = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired
};

export const settingsLicenseShape = PropTypes.shape(settingsLicenseProps);

const announcementProps = {
  text: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};

export const announcementShape = PropTypes.shape(announcementProps);

export const settingsShape = PropTypes.shape({
  documentCategoriesPage: settingsDocumentShape,
  helpPage: settingsDocumentShape,
  termsPage: settingsDocumentShape,
  footerLinks: PropTypes.objectOf(PropTypes.arrayOf(settingsDocumentShape)),
  license: settingsLicenseShape,
  announcement: announcementShape
});

export const settingsHomepagePresentationPerLanguageShape = PropTypes.shape({
  videoSourceUrl: PropTypes.string,
  posterImageSourceUrl: PropTypes.string,
  aboutDocumentId: PropTypes.string
});

export const settingsHomepageTrustLogoShape = PropTypes.shape({
  logoUrl: PropTypes.string,
  institutionUrl: PropTypes.string
});

export const settingsProps = {
  settings: settingsShape.isRequired
};

export const storagePlanShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  maxBytes: PropTypes.number.isRequired
});

export const userStorageShape = PropTypes.shape({
  plan: PropTypes.string,
  usedBytes: PropTypes.number,
  reminders: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    createdBy: PropTypes.string.isRequired
  }))
});

const favoriteItemShape = PropTypes.shape({
  type: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  setOn: PropTypes.string.isRequired
});

export const userShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  email: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  organization: PropTypes.string,
  profileOverview: PropTypes.string,
  shortDescription: PropTypes.string,
  role: PropTypes.string.isRequired,
  expiresOn: PropTypes.string,
  accountLockedOn: PropTypes.string,
  lastLoggedInOn: PropTypes.string,
  storage: userStorageShape,
  favorites: PropTypes.arrayOf(favoriteItemShape).isRequired
});

export const publicUserShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  email: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  organization: PropTypes.string,
  profileOverview: PropTypes.string,
  shortDescription: PropTypes.string,
  avatarUrl: PropTypes.string,
  accountClosedOn: PropTypes.string
});

export const userProps = {
  user: userShape
};

export const pageNameProps = {
  pageName: PropTypes.oneOf(Object.values(PAGE_NAME)).isRequired
};

export const otherUserShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  email: PropTypes.string, // This is only visible to admins
  displayName: PropTypes.string.isRequired
});

export const otherUserDisplayNameOnlyShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired
});

const commonDocumentRatingProps = {
  ratingsCount: PropTypes.number.isRequired,
  ratingsCountPerValue: PropTypes.arrayOf(PropTypes.number).isRequired,
  averageRatingValue: PropTypes.number
};

export const documentRatingBasicShape = PropTypes.shape({
  ...commonDocumentRatingProps
});

export const documentRatingShape = PropTypes.shape({
  ...commonDocumentRatingProps,
  _id: PropTypes.string,
  documentId: PropTypes.string.isRequired,
});

export const sectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  revision: PropTypes.string, // Not required because it's null for newly created sections
  deletedOn: PropTypes.string,
  deletedBy: otherUserShape,
  deletedBecause: PropTypes.string,
  type: PropTypes.string.isRequired,
  content: PropTypes.object
});

const commonDocumentOrRevisionProps = {
  order: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  roomId: PropTypes.string
};

export const documentMetadataShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired
});

export const documentExtendedMetadataShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  _id: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired
});

export const roomDocumentMetadataShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  _id: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  contributors: PropTypes.arrayOf(otherUserShape).isRequired,
  cdnResources: PropTypes.arrayOf(PropTypes.string).isRequired,
  roomContext: PropTypes.shape({
    draft: PropTypes.bool.isRequired,
    inputSubmittingDisabled: PropTypes.bool.isRequired
  }).isRequired
});

const contributedDocumentMetadataProps = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired
};

export const contributedDocumentMetadataShape = PropTypes.shape({
  ...contributedDocumentMetadataProps
});

export const documentPublicContextShape = PropTypes.shape({
  allowedEditors: PropTypes.arrayOf(otherUserShape),
  protected: PropTypes.bool,
  archived: PropTypes.bool,
  archiveRedirectionDocumentId: PropTypes.string,
  verified: PropTypes.bool,
  review: PropTypes.string
});

export const documentRoomContextShape = PropTypes.shape({
  draft: PropTypes.bool.isRequired,
  inputSubmittingDisabled: PropTypes.bool.isRequired
});

export const documentMetadataEditShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  cdnResources: PropTypes.arrayOf(PropTypes.string),
  publicContext: documentPublicContextShape,
  roomContext: documentRoomContextShape
});

export const documentShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  _id: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired,
  contributors: PropTypes.arrayOf(otherUserShape).isRequired
});

export const documentRevisionShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  _id: PropTypes.string.isRequired,
  documentId: PropTypes.string.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired,
  restoredFrom: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  publicContext: documentPublicContextShape,
  roomContext: documentRoomContextShape
});

export const documentInputSectionFileShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired
});

export const documentInputSectionCommentShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserDisplayNameOnlyShape.isRequired,
  deletedOn: PropTypes.string,
  deletedBy: otherUserDisplayNameOnlyShape,
  text: PropTypes.string.isRequired
});

export const sectionInputShape = PropTypes.shape({
  data: PropTypes.object,
  files: PropTypes.arrayOf(documentInputSectionFileShape).isRequired,
  comments: PropTypes.arrayOf(documentInputSectionCommentShape).isRequired
});

export const persistedDocumentInputShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  documentId: PropTypes.string.isRequired,
  documentRevisionId: PropTypes.string.isRequired,
  documentTitle: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired,
  sections: PropTypes.objectOf(sectionInputShape).isRequired
});

export const pendingDocumentInputShape = PropTypes.shape({
  sections: PropTypes.objectOf(sectionInputShape).isRequired,
  pendingFileMap: PropTypes.objectOf(PropTypes.instanceOf(File)).isRequired
});

export const documentInputShape = PropTypes.oneOfType([
  pendingDocumentInputShape,
  persistedDocumentInputShape
]);

const commonMediaFileProps = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  portableUrl: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired
};

export const commonMediaFileShape = PropTypes.shape({
  ...commonMediaFileProps
});

export const roomMediaItemShape = PropTypes.shape({
  ...commonMediaFileProps
});

const mediaLibraryItemProps = {
  ...commonMediaFileProps,
  _id: PropTypes.string.isRequired,
  resourceType: PropTypes.oneOf(Object.values(RESOURCE_TYPE)).isRequired,
  contentType: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  updatedBy: otherUserShape.isRequired,
  updatedOn: PropTypes.string.isRequired,
  shortDescription: PropTypes.string.isRequired,
  languages: PropTypes.arrayOf(PropTypes.string).isRequired,
  licenses: PropTypes.arrayOf(PropTypes.string).isRequired,
  allRightsReserved: PropTypes.bool.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired
};

export const mediaLibraryItemShape = PropTypes.shape({
  ...mediaLibraryItemProps
});

export const mediaLibraryItemWithRelevanceShape = PropTypes.shape({
  ...mediaLibraryItemProps,
  relevance: PropTypes.number.isRequired
});

export const mediaTrashItemShape = PropTypes.shape({
  ...commonMediaFileProps,
  _id: PropTypes.string.isRequired,
  resourceType: PropTypes.oneOf(Object.values(RESOURCE_TYPE)).isRequired,
  contentType: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  originalItem: mediaLibraryItemShape.isRequired
});

export const wikimediaFileShape = PropTypes.shape({
  pageId: PropTypes.number.isRequired,
  pageUrl: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  thumbnailUrl: PropTypes.string,
  updatedOn: PropTypes.string,
  size: PropTypes.number.isRequired,
  mimeType: PropTypes.string.isRequired
});

const roomStorageShape = PropTypes.shape({
  roomId: PropTypes.string.isRequired,
  roomName: PropTypes.string.isRequired,
  roomMediaItems: PropTypes.arrayOf(roomMediaItemShape).isRequired,
  usedBytesByRoomMediaItems: PropTypes.number.isRequired,
  usedBytesByDocumentInputMediaItems: PropTypes.number.isRequired,
  usedBytesPerDocumentInput: PropTypes.object.isRequired
});

export const allRoomMediaOverviewShape = PropTypes.shape({
  storagePlan: storagePlanShape,
  usedBytes: PropTypes.number.isRequired,
  roomStorageList: PropTypes.arrayOf(roomStorageShape).isRequired
});

export const singleRoomMediaOverviewShape = PropTypes.shape({
  storagePlan: storagePlanShape,
  usedBytes: PropTypes.number.isRequired,
  roomStorage: roomStorageShape.isRequired
});

export const roomMediaContextShape = PropTypes.shape({
  singleRoomMediaOverview: singleRoomMediaOverviewShape.isRequired,
  isDeletionEnabled: PropTypes.bool.isRequired
});

const formItemDimensionShape = PropTypes.shape({
  span: PropTypes.number.isRequired,
  offset: PropTypes.number
});

const formItemDimensionsShape = PropTypes.shape({
  xs: formItemDimensionShape.isRequired,
  sm: formItemDimensionShape.isRequired
});

export const formItemLayoutShape = PropTypes.shape({
  labelCol: formItemDimensionsShape.isRequired,
  wrapperCol: formItemDimensionsShape.isRequired
});

export const tailFormItemLayoutShape = PropTypes.shape({
  wrapperCol: formItemDimensionsShape.isRequired
});

export const commonTaskProps = {
  _id: PropTypes.string.isRequired,
  batchId: PropTypes.string.isRequired,
  taskType: PropTypes.oneOf(Object.values(TASK_TYPE)).isRequired,
  taskParams: PropTypes.any.isRequired,
  processed: PropTypes.bool.isRequired,
  attempts: PropTypes.arrayOf(PropTypes.shape({
    startedOn: PropTypes.string,
    completedOn: PropTypes.string,
    errors: PropTypes.arrayOf(PropTypes.any).isRequired
  })).isRequired
};

export const documentValidationTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.documentValidation]),
  taskParams: PropTypes.shape({
    documentId: PropTypes.string.isRequired
  }).isRequired
});

export const documentRegenerationTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.documentRegeneration]),
  taskParams: PropTypes.shape({
    documentId: PropTypes.string.isRequired
  }).isRequired
});

export const cdnResourcesConsolidationTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.cdnResourcesConsolidation]),
  taskParams: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(CDN_RESOURCES_CONSOLIDATION_TYPE)).isRequired,
    entityId: PropTypes.string.isRequired
  }).isRequired
});

export const commonBatchProps = {
  _id: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  createdOn: PropTypes.string.isRequired,
  completedOn: PropTypes.string,
  batchType: PropTypes.oneOf(Object.values(BATCH_TYPE)).isRequired,
  batchParams: PropTypes.any,
  errors: PropTypes.arrayOf(PropTypes.any).isRequired
};

export const documentValidationBatchDetailsShape = PropTypes.shape({
  ...commonBatchProps,
  batchType: PropTypes.oneOf([BATCH_TYPE.documentValidation]).isRequired,
  batchParams: PropTypes.shape({}),
  tasks: PropTypes.arrayOf(documentValidationTaskShape).isRequired
});

export const documentRegenerationBatchDetailsShape = PropTypes.shape({
  ...commonBatchProps,
  batchType: PropTypes.oneOf([BATCH_TYPE.documentRegeneration]).isRequired,
  batchParams: PropTypes.shape({}),
  tasks: PropTypes.arrayOf(documentRegenerationTaskShape).isRequired
});

export const cdnResourcesConsolidationBatchDetailsShape = PropTypes.shape({
  ...commonBatchProps,
  batchType: PropTypes.oneOf([BATCH_TYPE.cdnResourcesConsolidation]).isRequired,
  batchParams: PropTypes.shape({}),
  tasks: PropTypes.arrayOf(cdnResourcesConsolidationTaskShape).isRequired
});

export const roomOwnerShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  email: PropTypes.string,
  displayName: PropTypes.string.isRequired
});

export const roomMemberShape = PropTypes.shape({
  userId: PropTypes.string.isRequired,
  joinedOn: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string
});

export const roomMetadataProps = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string,
  ownedBy: PropTypes.string,
  createdOn: PropTypes.string,
  isCollaborative: PropTypes.bool.isRequired,
  shortDescription: PropTypes.string
};

export const roomContentProps = {
  overview: PropTypes.string.isRequired,
  cdnResources: PropTypes.arrayOf(PropTypes.string).isRequired
};

export const roomMinimalMetadataShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string
});

export const roomMetadataShape = PropTypes.shape(roomMetadataProps);

export const roomShape = PropTypes.shape({
  ...roomMetadataProps,
  ...roomContentProps,
  owner: roomOwnerShape.isRequired,
  members: PropTypes.arrayOf(roomMemberShape)
});

export const roomInvitationBasicProps = {
  _id: PropTypes.string.isRequired,
  sentOn: PropTypes.string.isRequired,
  expiresOn: PropTypes.string.isRequired
};

export const roomInvitationBasicShape = PropTypes.shape(roomInvitationBasicProps);

export const roomInvitationShape = PropTypes.shape({
  ...roomInvitationBasicProps,
  email: PropTypes.string.isRequired
});

export const roomMessageShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  emailNotification: PropTypes.bool.isRequired
});

export const userActivitiesShape = PropTypes.shape({
  type: PropTypes.oneOf(Object.values(USER_ACTIVITY_TYPE)).isRequired,
  timestamp: PropTypes.string.isRequired,
  data: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string
  }).isRequired,
  isDeprecated: PropTypes.bool.isRequired
});

export const documentCommentShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  topic: PropTypes.string.isRequired,
  text: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserDisplayNameOnlyShape.isRequired,
  deletedOn: PropTypes.string,
  deletedBy: otherUserDisplayNameOnlyShape
});

export const favoriteUserShape = publicUserShape;

export const favoriteRoomShape = PropTypes.shape({
  ...roomMetadataProps,
  _id: PropTypes.string,
  updatedOn: PropTypes.string,
  owner: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    email: PropTypes.string,
    displayName: PropTypes.string.isRequired
  }),
  members: PropTypes.arrayOf(roomMemberShape)
});

export const favoriteDocumentShape = PropTypes.shape({
  ...contributedDocumentMetadataProps
});

const commonDocumentEventParamsShape = PropTypes.shape({
  document: documentMetadataShape
});

export const notificationGroupShape = PropTypes.shape({
  notificationIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  eventType: PropTypes.oneOf(Object.values(EVENT_TYPE)),
  eventParams: PropTypes.oneOfType([commonDocumentEventParamsShape]).isRequired,
  firstCreatedOn: PropTypes.string.isRequired,
  lastCreatedOn: PropTypes.string.isRequired
});

export const documentCategoryShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  iconUrl: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  documentIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: otherUserDisplayNameOnlyShape.isRequired,
  updatedBy: otherUserDisplayNameOnlyShape.isRequired
});
