const React = require('react');
const PropTypes = require('prop-types');
const clientSettings = require('../../../bootstrap/client-settings');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function ImageContentDisplay({ content }) {
  let src;
  switch (content.src.type) {
    case 'external':
      src = content.src.url || null;
      break;
    case 'internal':
      src = content.src.url ? `${clientSettings.cdnRootURL}/${content.src.url}` : null;
      break;
    default:
      src = null;
      break;
  }

  return (
    <div className="Image">
      <img className={`Image-img u-max-width-${content.maxWidth || 100}`} src={src} />
    </div>
  );
}

ImageContentDisplay.propTypes = {
  ...sectionDisplayProps
};

// Wrapper:
/* eslint react/no-multi-comp: 0 */

function ImageDisplay({ preferredLanguages, section }) {
  const language = preferredLanguages[0];
  const content = section.content[language];

  return (
    <ImageContentDisplay content={content} language={language} />
  );
}

ImageDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = ImageDisplay;
