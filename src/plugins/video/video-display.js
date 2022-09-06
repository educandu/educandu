import React from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { IMAGE_SOURCE_TYPE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

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
  switch (content.posterImage.sourceType) {
    case IMAGE_SOURCE_TYPE.internal:
      posterImageUrl = content.posterImage.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.posterImage.sourceUrl}` : null;
      break;
    default:
      throw Error('Only internal poster images are allowed');
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
        <CopyrightNotice value={content.copyrightNotice} />
      </div>
    </div>
  );
}

VideoDisplay.propTypes = {
  ...sectionDisplayProps
};

export default VideoDisplay;
