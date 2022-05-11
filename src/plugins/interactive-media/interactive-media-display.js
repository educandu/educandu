import React from 'react';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function InteractiveMediaDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  let sourceUrl;
  switch (content.sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
      sourceUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      sourceUrl = content.sourceUrl || null;
      break;
  }

  return (
    <div className="InteractiveMediaDisplay">
      <div className={`InteractiveMediaDisplay-content u-width-${content.width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            sourceUrl={sourceUrl}
            audioOnly={!content.showVideo}
            aspectRatio={content.aspectRatio}
            startTimecode={content.sourceStartTimecode}
            stopTimecode={content.sourceStopTimecode}
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
