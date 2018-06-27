const React = require('react');
const clientSettings = require('../../../bootstrap/client-settings');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function AudioDisplay({ content }) {
  let src;
  switch (content.type) {
    case 'external':
      src = content.url || null;
      break;
    case 'internal':
      src = content.url ? `${clientSettings.cdnRootURL}/${content.url}` : null;
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

AudioDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = AudioDisplay;
