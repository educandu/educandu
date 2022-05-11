import PropTypes from 'prop-types';
import { PAGE_NAME } from '../domain/page-name.js';
import {
  BATCH_TYPE,
  CDN_RESOURCES_CONSOLIDATION_TASK_TYPE,
  DOCUMENT_IMPORT_TYPE,
  FAVORITE_TYPE,
  ROOM_ACCESS_LEVEL,
  STORAGE_LOCATION_TYPE,
  TASK_TYPE,
  USER_ACTIVITY_TYPE
} from '../domain/constants.js';

export const storageLocationShape = PropTypes.shape({
  type: PropTypes.oneOf(Object.values(STORAGE_LOCATION_TYPE)).isRequired,
  usedBytes: PropTypes.number,
  maxBytes: PropTypes.number,
  rootPath: PropTypes.string.isRequired,
  initialPath: PropTypes.string,
  uploadPath: PropTypes.string,
  isDeletionEnabled: PropTypes.bool.isRequired
});

export const storageShape = PropTypes.shape({ locations: PropTypes.arrayOf(storageLocationShape) });

export const sectionDisplayProps = {
  content: PropTypes.any
};

export const sectionEditorProps = {
  ...sectionDisplayProps,
  onContentChanged: PropTypes.func.isRequired
};

export const importSourceProps = {
  name: PropTypes.string.isRequired,
  hostName: PropTypes.string.isRequired,
  allowUnsecure: PropTypes.bool
};

export const importSourceShape = PropTypes.shape(importSourceProps);

export const clientConfigProps = {
  clientConfig: PropTypes.shape({
    cdnRootUrl: PropTypes.string.isRequired,
    disabledFeatures: PropTypes.arrayOf(PropTypes.string).isRequired,
    importSources: PropTypes.arrayOf(importSourceShape).isRequired,
    consentCookieNamePrefix: PropTypes.string.isRequired,
    areRoomsEnabled: PropTypes.bool.isRequired
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
  documentKey: PropTypes.string
};

export const settingsDocumentShape = PropTypes.shape(settingsDocumentProps);

const settingsLicenseProps = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired
};

export const settingsLicenseShape = PropTypes.shape(settingsLicenseProps);

export const settingsShape = PropTypes.shape({
  helpPage: PropTypes.objectOf(settingsDocumentShape),
  termsPage: PropTypes.objectOf(settingsDocumentShape),
  footerLinks: PropTypes.objectOf(PropTypes.arrayOf(settingsDocumentShape)),
  defaultTags: PropTypes.arrayOf(PropTypes.string),
  license: PropTypes.shape(settingsLicenseProps)
});

export const settingsProps = {
  settings: settingsShape.isRequired
};

export const baseStoragePlanProps = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  maxBytes: PropTypes.number.isRequired
};

export const storagePlanWithAssignedUserCountProps = {
  ...baseStoragePlanProps,
  assignedUserCount: PropTypes.number.isRequired
};

export const baseStoragePlanShape = PropTypes.shape({
  ...baseStoragePlanProps
});

export const storagePlanWithAssignedUserCountShape = PropTypes.shape({
  ...storagePlanWithAssignedUserCountProps
});

export const userProfileShape = PropTypes.shape({
  city: PropTypes.string,
  country: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  postalCode: PropTypes.string,
  street: PropTypes.string,
  streetSupplement: PropTypes.string
});

export const userStorageShape = PropTypes.shape({
  plan: PropTypes.string,
  usedBytes: PropTypes.number,
  reminders: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    createdBy: PropTypes.string.isRequired
  }))
});

export const userFavoriteShape = PropTypes.shape({
  type: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  setOn: PropTypes.string.isRequired
});

export const userShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  provider: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string,
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  expires: PropTypes.string,
  lockedOut: PropTypes.bool,
  profile: userProfileShape,
  storage: userStorageShape,
  favorites: PropTypes.arrayOf(userFavoriteShape).isRequired
});

export const userProps = {
  user: userShape
};

export const pageNameProps = {
  pageName: PropTypes.oneOf(Object.values(PAGE_NAME)).isRequired
};

const userInDocShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string // This is only visible to super users
});

export const sectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  revision: PropTypes.string, // Not required because it's null for newly created sections
  deletedOn: PropTypes.string,
  deletedBy: userInDocShape,
  deletedBecause: PropTypes.string,
  type: PropTypes.string.isRequired,
  content: PropTypes.object
});

const commonDocumentOrRevisionProps = {
  _id: PropTypes.string.isRequired,
  key: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired,
  createdOn: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired
};

export const documentMetadataShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  revision: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: userInDocShape.isRequired
});

export const documentMetadataEditShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired
});

export const documentShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  revision: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  updatedBy: userInDocShape.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired,
  contributors: PropTypes.arrayOf(userInDocShape).isRequired
});

export const documentRevisionShape = PropTypes.shape({
  ...commonDocumentOrRevisionProps,
  sections: PropTypes.arrayOf(sectionShape).isRequired,
  restoredFrom: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  archived: PropTypes.bool.isRequired,
  origin: PropTypes.string.isRequired,
  originUrl: PropTypes.string.isRequred
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

export const documentImportTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.documentImport]),
  taskParams: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    updatedOn: PropTypes.string,
    importedRevision: PropTypes.string,
    importableRevision: PropTypes.string.isRequired,
    importType: PropTypes.oneOf(Object.values(DOCUMENT_IMPORT_TYPE))
  }).isRequired
});

export const documentRegenerationTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.documentRegeneration]),
  taskParams: PropTypes.shape({
    key: PropTypes.string.isRequired
  }).isRequired
});

export const cdnResourcesConsolidationTaskShape = PropTypes.shape({
  ...commonTaskProps,
  taskType: PropTypes.oneOf([TASK_TYPE.cdnResourcesConsolidation]),
  taskParams: PropTypes.oneOfType([
    PropTypes.shape({
      type: PropTypes.oneOf([CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.document]),
      documentKey: PropTypes.string.isRequired
    }),
    PropTypes.shape({
      type: PropTypes.oneOf([CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.lesson]),
      lessonId: PropTypes.string.isRequired
    })
  ]).isRequired
});

export const commonBatchProps = {
  _id: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired,
  createdOn: PropTypes.string.isRequired,
  completedOn: PropTypes.string,
  batchType: PropTypes.oneOf(Object.values(BATCH_TYPE)).isRequired,
  batchParams: PropTypes.any,
  errors: PropTypes.arrayOf(PropTypes.any).isRequired
};

export const batchShape = PropTypes.shape(commonBatchProps);

export const documentImportBatchDetailsShape = PropTypes.shape({
  ...commonBatchProps,
  batchType: PropTypes.oneOf([BATCH_TYPE.documentImport]).isRequired,
  batchParams: importSourceShape.isRequired,
  tasks: PropTypes.arrayOf(documentImportTaskShape).isRequired
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
  username: PropTypes.string.isRequired,
  email: PropTypes.string
});

export const roomMemberShape = PropTypes.shape({
  userId: PropTypes.string.isRequired,
  joinedOn: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired
});

export const roomMetadataProps = {
  name: PropTypes.string.isRequired,
  slug: PropTypes.string,
  access: PropTypes.oneOf(Object.values(ROOM_ACCESS_LEVEL)).isRequired,
  description: PropTypes.string
};

export const roomMetadataShape = PropTypes.shape(roomMetadataProps);

export const roomShape = PropTypes.shape({
  ...roomMetadataProps,
  _id: PropTypes.string.isRequired,
  owner: roomOwnerShape.isRequired,
  members: PropTypes.arrayOf(roomMemberShape)
});

export const invitationShape = PropTypes.shape({
  email: PropTypes.string.isRequired,
  sentOn: PropTypes.string.isRequired,
  expires: PropTypes.string.isRequired
});

export const lessonMetadataProps = {
  _id: PropTypes.string.isRequired,
  roomId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  language: PropTypes.string.isRequired,
  schedule: PropTypes.shape({
    startsOn: PropTypes.string
  })
};

export const lessonSectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  content: PropTypes.object
});

export const lessonMetadataShape = PropTypes.shape({
  ...lessonMetadataProps
});

export const lessonShape = PropTypes.shape({
  ...lessonMetadataProps,
  sections: PropTypes.arrayOf(lessonSectionShape).isRequired
});

export const userActivitiesShape = PropTypes.shape({
  type: PropTypes.oneOf(Object.values(USER_ACTIVITY_TYPE)).isRequired,
  timestamp: PropTypes.string.isRequired,
  data: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string
  }).isRequired
});

export const userFavoritesShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  setOn: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(FAVORITE_TYPE)).isRequired
});
