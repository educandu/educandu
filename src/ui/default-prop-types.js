import PropTypes from 'prop-types';
import { BATCH_TYPE, DOCUMENT_IMPORT_TYPE, TASK_TYPE } from '../common/constants.js';
import { PAGE_NAME } from '../domain/page-name.js';

export const translationProps = {
  i18n: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
};

export const sectionDisplayProps = {
  docKey: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
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
    consentCookieName: PropTypes.string.isRequired
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

export const homeLanguageSettingProps = {
  language: PropTypes.string.isRequired,
  documentKey: PropTypes.string.isRequired
};

export const homeLanguageShape = PropTypes.shape(homeLanguageSettingProps);

const settingsDocumentProps = {
  linkTitle: PropTypes.string.isRequired,
  documentKey: PropTypes.string.isRequired,
  documentSlug: PropTypes.string.isRequired
};

export const settingsDocumentShape = PropTypes.shape(settingsDocumentProps);

export const settingsShape = PropTypes.shape({
  homeLanguages: PropTypes.arrayOf(homeLanguageShape),
  helpPage: PropTypes.objectOf(settingsDocumentShape),
  termsPage: PropTypes.objectOf(settingsDocumentShape),
  footerLinks: PropTypes.objectOf(PropTypes.arrayOf(settingsDocumentShape)),
  defaultTags: PropTypes.arrayOf(PropTypes.string)
});

export const settingsProps = {
  settings: settingsShape.isRequired
};

export const userProfileShape = PropTypes.shape({
  city: PropTypes.string,
  country: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  postalCode: PropTypes.string,
  street: PropTypes.string,
  streetSupplement: PropTypes.string
});

export const userShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  provider: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  expires: PropTypes.string,
  lockedOut: PropTypes.bool,
  profile: userProfileShape
});

export const userProps = {
  user: userShape
};

export const languageProps = {
  language: PropTypes.string.isRequired,
  locale: PropTypes.string.isRequired
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

export const searchResultShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  updatedOn: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  tagMatchCount: PropTypes.number.isRequired
});

const commonDocumentOrRevisionProps = {
  _id: PropTypes.string.isRequired,
  key: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
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

export const importTaskShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  batchId: PropTypes.string.isRequired,
  taskType: PropTypes.oneOf(Object.values(TASK_TYPE)),
  processed: PropTypes.bool.isRequired,
  attempts: PropTypes.arrayOf(PropTypes.shape({
    startedOn: PropTypes.string,
    completedOn: PropTypes.string,
    errors: PropTypes.arrayOf(PropTypes.any).isRequired
  })),
  taskParams: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    updatedOn: PropTypes.string,
    importedRevision: PropTypes.string,
    importableRevision: PropTypes.string.isRequired,
    importType: PropTypes.oneOf(Object.values(DOCUMENT_IMPORT_TYPE))
  })
});

export const batchProps = {
  _id: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired,
  createdOn: PropTypes.string.isRequired,
  completedOn: PropTypes.string,
  batchType: PropTypes.oneOf(Object.values(BATCH_TYPE)),
  errors: PropTypes.arrayOf(PropTypes.any).isRequired
};

export const importBatchShape = PropTypes.shape(batchProps);

export const importBatchDetailsShape = PropTypes.shape({
  ...batchProps,
  batchParams: importSourceShape,
  tasks: PropTypes.arrayOf(importTaskShape)
});
