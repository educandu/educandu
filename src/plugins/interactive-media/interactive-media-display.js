import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { ASPECT_RATIO } from '../../components/media-player-constants.js';

function InteractiveMediaDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  let sourceUrl;
  switch (content.sourceType) {
    case SOURCE_TYPE.internal:
      sourceUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      sourceUrl = content.sourceUrl || null;
      break;
  }

  const aspectRatio = content.aspectRatio?.h === 4 && content.aspectRatio?.v === 3
    ? ASPECT_RATIO.fourToThree
    : ASPECT_RATIO.sixteenToNine;

  return (
    <div className="InteractiveMediaDisplay">
      <div className={`InteractiveMediaDisplay-content u-width-${content.width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            sourceUrl={sourceUrl}
            audioOnly={!content.showVideo}
            aspectRatio={aspectRatio}
            />
        )}
        {content.text && (
          <div className="InteractiveMediaDisplay-text">
            <Markdown>{content.text}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

InteractiveMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default InteractiveMediaDisplay;
