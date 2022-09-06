import React, { useMemo, useRef } from 'react';
import urlUtils from '../../utils/url-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

function MediaSlideshowDisplay({ content }) {
  const { sourceType, width, playbackRange, copyrightNotice, chapters } = content;

  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);

  const parts = useMemo(() => chapters.map(chapter => ({
    startPosition: chapter.startPosition
  })), [chapters]);

  const sourceUrl = urlUtils.getMediaUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType: content.sourceType,
    sourceUrl: content.sourceUrl
  });

  const renderChapterOverlay = () => {

  };

  return (
    <div className="MediaSlideshowDisplay">
      <div className={`MediaSlideshowDisplay-content u-width-${width || 100}`}>
        <MediaPlayer
          mediaPlayerRef={mediaPlayerRef}
          parts={parts}
          source={sourceUrl}
          screenMode={MEDIA_SCREEN_MODE.audio}
          screenOverlay={renderChapterOverlay()}
          aspectRatio={MEDIA_ASPECT_RATIO.sixteenToNine}
          playbackRange={playbackRange}
          canDownload={sourceType === MEDIA_SOURCE_TYPE.internal}
          />
        <CopyrightNotice value={copyrightNotice} />
        {/* Also for current image */}
      </div>
    </div>
  );
}

MediaSlideshowDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MediaSlideshowDisplay;
