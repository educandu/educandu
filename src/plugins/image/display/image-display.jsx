const React = require('react');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps, clientSettingsProps } = require('../../../ui/default-prop-types');

function ImageDisplay({ content, clientSettings }) {
  let src;
  switch (content.type) {
    case 'external':
      src = content.url || null;
      break;
    case 'internal':
      src = content.url ? `${clientSettings.cdnRootUrl}/${content.url}` : null;
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
  ...sectionDisplayProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, ImageDisplay);
