import PropTypes from 'prop-types';
import { isBrowser } from './browser-helper.js';
import { PAGE_NAME } from '../domain/page-name.js';
import {
  BATCH_TYPE,
  CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE,
  ROOM_DOCUMENTS_MODE,
  STORAGE_LOCATION_TYPE,
  TASK_TYPE,
  USER_ACTIVITY_TYPE,
  RESOURCE_TYPE
} from '../domain/constants.js';

const File = isBrowser() ? window.File : class File {};

export const browserFileType = PropTypes.instanceOf(File);

export const samlIdentityProviderClientShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  logoUrl: PropTypes.string
});

export const sectionDisplayProps = {
  content: PropTypes.any
};

export const sectionEditorProps = {
  ...sectionDisplayProps,
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
  introduction: PropTypes.string,
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  introduction: PropTypes.string,
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
  description: PropTypes.string.isRequired,
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

const contributedDocumentMetadataProps = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: otherUserShape.isRequired
};

export const contributedDocumentMetadataShape = PropTypes.shape({
  ...contributedDocumentMetadataProps
});

export const documentPublicContextShape = PropTypes.shape({
  accreditedEditors: PropTypes.arrayOf(otherUserShape),
  protected: PropTypes.bool,
  archived: PropTypes.bool,
  verified: PropTypes.bool,
  review: PropTypes.string
});

export const documentMetadataEditShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  publicContext: documentPublicContextShape
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
  publicContext: documentPublicContextShape
});

export const storageLocationShape = PropTypes.shape({
  type: PropTypes.oneOf(Object.values(STORAGE_LOCATION_TYPE)).isRequired,
  usedBytes: PropTypes.number,
  maxBytes: PropTypes.number,
  path: PropTypes.string.isRequired,
  isDeletionEnabled: PropTypes.bool.isRequired
});

const commonFileProps = {
  url: PropTypes.string.isRequired,
  portableUrl: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired
};

export const commonFileShape = PropTypes.shape({
  ...commonFileProps
});

export const cdnObjectShape = PropTypes.shape({
  ...commonFileProps,
  path: PropTypes.string.isRequired,
  parentPath: PropTypes.string.isRequired
});

const mediaLibraryItemProps = {
  ...commonFileProps,
  _id: PropTypes.string.isRequired,
  resourceType: PropTypes.oneOf(Object.values(RESOURCE_TYPE)).isRequired,
  contentType: PropTypes.string.isRequired,
  createdBy: otherUserShape.isRequired,
  updatedBy: otherUserShape.isRequired,
  description: PropTypes.string.isRequired,
  languages: PropTypes.arrayOf(PropTypes.string).isRequired,
  licenses: PropTypes.arrayOf(PropTypes.string).isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired
};

export const mediaLibraryItemShape = PropTypes.shape({
  ...mediaLibraryItemProps
});

export const mediaLibraryItemWithRelevanceShape = PropTypes.shape({
  ...mediaLibraryItemProps,
  relevance: PropTypes.number.isRequired
});

export const wikimediaFileShape = PropTypes.shape({
  pageId: PropTypes.number.isRequired,
  pageUrl: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  thumbnailUrl: PropTypes.string,
  updatedOn: PropTypes.string,
  size: PropTypes.number.isRequired,
  mimeType: PropTypes.string.isRequired
});

export const storageShape = PropTypes.shape({ locations: PropTypes.arrayOf(storageLocationShape) });

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
    documentId: PropTypes.string.isRequired
  }).isRequired
});

export const cdnUploadDirectoryCreationTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.cdnUploadDirectoryCreation]),
  taskParams: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.oneOf([CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document]),
      documentId: PropTypes.string.isRequired
    }),
    PropTypes.shape({
      type: PropTypes.oneOf([CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.room]),
      roomId: PropTypes.string.isRequired
    })
  ]).isRequired
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

export const cdnUploadDirectoryCreationBatchDetailsShape = PropTypes.shape({
  ...commonBatchProps,
  batchType: PropTypes.oneOf([BATCH_TYPE.cdnUploadDirectoryCreation]).isRequired,
  batchParams: PropTypes.shape({}),
  tasks: PropTypes.arrayOf(cdnUploadDirectoryCreationTaskShape).isRequired
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
  createdOn: PropTypes.string,
  documentsMode: PropTypes.oneOf(Object.values(ROOM_DOCUMENTS_MODE)).isRequired,
  description: PropTypes.string
};

export const roomMinimalMetadataShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string
});

export const roomMetadataShape = PropTypes.shape(roomMetadataProps);

export const roomShape = PropTypes.shape({
  ...roomMetadataProps,
  owner: roomOwnerShape.isRequired,
  members: PropTypes.arrayOf(roomMemberShape)
});

export const invitationBasicProps = {
  _id: PropTypes.string.isRequired,
  sentOn: PropTypes.string.isRequired,
  expiresOn: PropTypes.string.isRequired
};

export const invitationBasicShape = PropTypes.shape(invitationBasicProps);

export const invitationShape = PropTypes.shape({
  ...invitationBasicProps,
  email: PropTypes.string.isRequired
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

export const commentShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  topic: PropTypes.string.isRequired,
  text: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  createdBy: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  }).isRequired,
  deletedOn: PropTypes.string,
  deletedBy: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  })
});

export const favoriteUserShape = PropTypes.shape({
  displayName: PropTypes.string.isRequired,
  avatarUrl: PropTypes.string
});

export const favoriteRoomShape = PropTypes.shape({
  ...roomMetadataProps,
  _id: PropTypes.string,
  updatedOn: PropTypes.string,
  owner: PropTypes.shape({
    email: PropTypes.string,
    displayName: PropTypes.string.isRequired
  }),
  members: PropTypes.arrayOf(roomMemberShape)
});

export const favoriteDocumentShape = PropTypes.shape({
  ...contributedDocumentMetadataProps
});
