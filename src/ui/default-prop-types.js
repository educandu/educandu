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

// This should always use the full user in the future
export const userInDocShape = PropTypes.oneOfType([
  PropTypes.shape({
    key: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string // This is only visible to super users
  }),
  PropTypes.shape({
    id: PropTypes.string.isRequired
  })
]);

export const userProps = {
  user: userShape
};

export const dataProps = {
  data: PropTypes.object.isRequired
};

export const docMetadataShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  snapshotId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  order: PropTypes.number.isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired,
  updatedBy: userInDocShape.isRequired,
  contributors: PropTypes.arrayOf(userInDocShape)
});

export const docShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired,
  updatedBy: userInDocShape.isRequired,
  contributors: PropTypes.arrayOf(userInDocShape)
});

export const fullDocShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  snapshotId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  order: PropTypes.number.isRequired,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired,
  updatedBy: userInDocShape.isRequired,
  contributors: PropTypes.arrayOf(userInDocShape),
  sections: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    ancestorId: PropTypes.string,
    order: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    content: PropTypes.any,
    createdOn: PropTypes.string.isRequired,
    createdBy: userInDocShape.isRequired,
    deletedOn: PropTypes.string,
    deletedBy: userInDocShape
  }))
});

export const sectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  order: PropTypes.number,
  type: PropTypes.string.isRequired,
  content: PropTypes.any,
  createdOn: PropTypes.string,
  createdBy: userInDocShape,
  deletedOn: PropTypes.string,
  deletedBy: userInDocShape
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
  createdBy: userInDocShape.isRequired,
  updatedBy: userInDocShape.isRequired
});
