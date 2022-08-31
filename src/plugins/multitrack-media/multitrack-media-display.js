import React, { useRef } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { getFullSourceUrl } from '../../utils/media-utils.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MultitrackMediaDisplay({ content }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);

  const { width, mainTrack, secondaryTracks } = content;

  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: getFullSourceUrl({
        url: mainTrack.sourceUrl,
        sourceType: mainTrack.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: mainTrack.volume,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: getFullSourceUrl({
        url: track.sourceUrl,
        sourceType: track.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: track.volume
    }))
  };

  const combinedCopyrightNotice = [mainTrack.copyrightNotice, ...secondaryTracks.map(track => track.copyrightNotice)].filter(text => !!text).join('\n\n');

  return (
    <div className="MultitrackMediaDisplay">
      <div className={`MultitrackMediaDisplay-content u-width-${width || 100}`}>
        <MultitrackMediaPlayer
          sources={sources}
          aspectRatio={mainTrack.aspectRatio}
          screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
          mediaPlayerRef={playerRef}
          showTrackMixer
          />
        <CopyrightNotice value={combinedCopyrightNotice} />
      </div>
    </div>
  );
}

MultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MultitrackMediaDisplay;
