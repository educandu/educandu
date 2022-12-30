import React from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/plyr/media-player.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';

function VideoDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const url = getAccessibleUrl({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const canDownload = isInternalSourceType({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const posterImageUrl = getAccessibleUrl({ url: content.posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="VideoDisplay">
      <div className={`VideoDisplay-content u-width-${content.width || 100}`}>
        {!!url && (
          <MediaPlayer
            sourceUrl={url}
            posterImageUrl={posterImageUrl}
            aspectRatio={content.aspectRatio}
            canDownload={canDownload}
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
