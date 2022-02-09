import React from 'react';
import { SOURCE_TYPE } from '../constants.js';
import AudioPlayer from '../../../components/audio-player.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';

function AudioDisplay({ content }) {
  let soundUrl;
  const legendHtml = content.text || '';

  const clientConfig = useService(ClientConfig);

  switch (content.type) {
    case SOURCE_TYPE.external:
      soundUrl = content.url || null;
      break;
    case SOURCE_TYPE.internal:
      soundUrl = content.url ? `${clientConfig.cdnRootUrl}/${content.url}` : null;
      break;
    default:
      soundUrl = null;
      break;
  }

  return (
    <div className="Audio">
      <AudioPlayer soundUrl={soundUrl} legendHtml={legendHtml} />
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioDisplay;
