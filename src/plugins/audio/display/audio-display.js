import React from 'react';
import AudioPlayer from '../../../components/audio-player';
import { inject } from '../../../components/container-context';
import ClientSettings from '../../../bootstrap/client-settings';
import { sectionDisplayProps, clientSettingsProps } from '../../../ui/default-prop-types';

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

export default inject({
  clientSettings: ClientSettings
}, AudioDisplay);
