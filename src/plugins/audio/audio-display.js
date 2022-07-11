import React from 'react';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
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
            screenMode={MEDIA_SCREEN_MODE.none}
            sourceUrl={sourceUrl}
            canDownload={content.sourceType === MEDIA_SOURCE_TYPE.internal}
            />
        )}
        {content.copyrightNotice && (
          <div className="AudioDisplay-copyrightNotice">
            <Markdown>{content.copyrightNotice}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AudioDisplay;
