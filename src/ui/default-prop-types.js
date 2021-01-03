import PropTypes from 'prop-types';

export const sectionDisplayProps = {
  docKey: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  content: PropTypes.any,
  language: PropTypes.string.isRequired
};

export const sectionEditorProps = {
  ...sectionDisplayProps,
  onContentChanged: PropTypes.func.isRequired
};

export const clientSettingsProps = {
  clientSettings: PropTypes.shape({
    env: PropTypes.string.isRequired,
    cdnRootUrl: PropTypes.string.isRequired
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

export const settingsShape = PropTypes.shape({
  landingPageDocumentId: PropTypes.string
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

export const dataProps = {
  data: PropTypes.object.isRequired
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
  slug: PropTypes.string,
  namespace: PropTypes.string.isRequired,
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
  sections: PropTypes.arrayOf(sectionShape).isRequired
});

export const menuNodeShape = PropTypes.any;

export const menuShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  defaultDocumentKey: PropTypes.string,
  nodes: PropTypes.arrayOf(menuNodeShape).isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  updatedBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});
