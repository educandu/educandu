import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function VideoDisplay({ content }) {
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

  let posterImageUrl;
  switch (content.posterImage?.sourceType) {
    case SOURCE_TYPE.internal:
      posterImageUrl = content.posterImage.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.posterImage.sourceUrl}` : null;
      break;
    default:
      posterImageUrl = content.posterImage?.sourceUrl || null;
      break;
  }

  return (
    <div className="VideoDisplay">
      <div className={`VideoDisplay-content u-width-${content.width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            sourceUrl={sourceUrl}
            posterImageUrl={posterImageUrl}
            audioOnly={!content.showVideo}
            aspectRatio={content.aspectRatio}
            />
        )}
        {content.text && (
          <div className="VideoDisplay-text">
            <Markdown>{content.text}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

VideoDisplay.propTypes = {
  ...sectionDisplayProps
};

export default VideoDisplay;
