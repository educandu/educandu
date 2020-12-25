const React = require('react');
const AudioPlayer = require('../../../components/audio-player');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context');
const { sectionDisplayProps, clientSettingsProps } = require('../../../ui/default-prop-types');

function AudioDisplay({ content, clientSettings }) {

  let soundUrl;
  switch (content.type) {
    case 'external':
      soundUrl = content.url || null;
      break;
    case 'internal':
      soundUrl = content.url ? `${clientSettings.cdnRootUrl}/${content.url}` : null;
      break;
    default:
      soundUrl = null;
      break;
  }

  const legendHtml = content.text || '';

  return (
    <div className="Audio">
      <AudioPlayer soundUrl={soundUrl} legendHtml={legendHtml} />
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, AudioDisplay);
