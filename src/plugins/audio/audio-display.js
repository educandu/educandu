import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import AudioPlayer from '../../components/audio-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function AudioDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  let soundUrl;
  switch (content.sourceType) {
    case SOURCE_TYPE.external:
      soundUrl = content.sourceUrl || null;
      break;
    case SOURCE_TYPE.internal:
      soundUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      soundUrl = null;
      break;
  }

  return (
    <div className="Audio">
      <AudioPlayer soundUrl={soundUrl} legendMarkdown={content.text} />
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioDisplay;
