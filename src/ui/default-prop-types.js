const PropTypes = require('prop-types');

const sectionDisplayProps = {
  content: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired
};

const sectionEditorProps = {
  content: PropTypes.object.isRequired,
  onContentChanged: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired
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

module.exports = {
  sectionDisplayProps,
  sectionEditorProps,
  clientSettingsProps,
  requestProps,
  userProps
};
