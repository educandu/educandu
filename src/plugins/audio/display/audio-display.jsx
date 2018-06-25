const React = require('react');
const PropTypes = require('prop-types');
const clientSettings = require('../../../bootstrap/client-settings');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function AudioContentDisplay({ content }) {
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
    <div className="Audio">
      <audio src={src} controls />
    </div>
  );
}

AudioContentDisplay.propTypes = {
  ...sectionDisplayProps
};

// Wrapper:
/* eslint react/no-multi-comp: 0 */

function AudioDisplay({ preferredLanguages, section }) {
  const language = preferredLanguages[0];
  const content = section.content[language];

  return (
    <AudioContentDisplay content={content} language={language} />
  );
}

AudioDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = AudioDisplay;
