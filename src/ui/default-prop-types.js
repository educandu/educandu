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

module.exports = {
  sectionDisplayProps,
  sectionEditorProps,
  clientSettingsProps
};
