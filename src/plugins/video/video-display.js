import React from 'react';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function VideoDisplay({ content }) {
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

  let posterImageUrl;
  switch (content.posterImage?.sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
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
            source={sourceUrl}
            posterImageUrl={posterImageUrl}
            aspectRatio={content.aspectRatio}
            canDownload={content.sourceType === MEDIA_SOURCE_TYPE.internal}
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
