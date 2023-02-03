import React from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';

function AudioDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const url = getAccessibleUrl({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const canDownload = isInternalSourceType({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="AudioDisplay">
      <div className="AudioDisplay-content">
        {!!url && (
          <MediaPlayer
            canDownload={canDownload}
            playbackRange={content.playbackRange}
            screenMode={MEDIA_SCREEN_MODE.none}
            sourceUrl={url}
            volume={content.initialVolume}
            />
        )}
        <CopyrightNotice value={content.copyrightNotice} />
      </div>
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioDisplay;
