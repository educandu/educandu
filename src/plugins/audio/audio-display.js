import React from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

function AudioDisplay({ content }) {
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
    <div className="AudioDisplay">
      <div className="AudioDisplay-content">
        {sourceUrl && (
          <MediaPlayer
            source={sourceUrl}
            screenMode={MEDIA_SCREEN_MODE.none}
            canDownload={content.sourceType === MEDIA_SOURCE_TYPE.internal}
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
