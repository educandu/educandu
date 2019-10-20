const PropTypes = require('prop-types');

const sectionDisplayProps = {
  docKey: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  content: PropTypes.any,
  language: PropTypes.string.isRequired
};

const sectionEditorProps = {
  ...sectionDisplayProps,
  onContentChanged: PropTypes.func.isRequired
};

const clientSettingsProps = {
  clientSettings: PropTypes.shape({
    env: PropTypes.string.isRequired,
    cdnRootUrl: PropTypes.string.isRequired
  }).isRequired
};

const requestProps = {
  request: PropTypes.shape({
    ip: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    protocol: PropTypes.string.isRequired,
    originalUrl: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired
  }).isRequired
};

const settingsShape = PropTypes.shape({
  landingPageDocumentId: PropTypes.string
});

const userProfileShape = PropTypes.shape({
  city: PropTypes.string,
  country: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  postalCode: PropTypes.string,
  street: PropTypes.string,
  streetSupplement: PropTypes.string
});

const userShape = PropTypes.shape({
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
const userInDocShape = PropTypes.oneOfType([
  PropTypes.shape({
    key: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string // This is only visible to super users
  }),
  PropTypes.shape({
    id: PropTypes.string.isRequired
  })
]);

const userProps = {
  user: userShape
};

const dataProps = {
  data: PropTypes.object.isRequired
};

const docMetadataShape = PropTypes.shape({
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

const docShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: userInDocShape.isRequired,
  updatedBy: userInDocShape.isRequired,
  contributors: PropTypes.arrayOf(userInDocShape)
});

const fullDocShape = PropTypes.shape({
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

const sectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  order: PropTypes.number,
  type: PropTypes.string.isRequired,
  content: PropTypes.any,
  createdOn: PropTypes.string,
  createdBy: userInDocShape,
  deletedOn: PropTypes.string,
  deletedBy: userInDocShape
});

const menuNodeShape = PropTypes.any;

const menuShape = PropTypes.shape({
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

module.exports = {
  sectionDisplayProps,
  sectionEditorProps,
  clientSettingsProps,
  requestProps,
  settingsShape,
  userProps,
  dataProps,
  docMetadataShape,
  docShape,
  fullDocShape,
  sectionShape,
  menuNodeShape,
  menuShape,
  userShape
};
