const React = require('react');
const clientSettings = require('../../../bootstrap/client-settings');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function ImageDisplay({ content }) {
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
    <div className="Image">
      <img className={`Image-img u-max-width-${content.maxWidth || 100}`} src={src} />
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = ImageDisplay;
