const PropTypes = require('prop-types');

const sectionDisplayProps = {
  docKey: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  content: PropTypes.object.isRequired,
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

const userProps = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string).isRequired
  })
};

const docShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  slug: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  updatedOn: PropTypes.string.isRequired,
  createdBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  updatedBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
});

const sectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  order: PropTypes.number,
  type: PropTypes.string.isRequired,
  content: PropTypes.any.isRequired,
  createdOn: PropTypes.string,
  createdBy: PropTypes.shape({
    id: PropTypes.string.isRequired
  })
});

module.exports = {
  sectionDisplayProps,
  sectionEditorProps,
  clientSettingsProps,
  requestProps,
  userProps,
  docShape,
  sectionShape
};
