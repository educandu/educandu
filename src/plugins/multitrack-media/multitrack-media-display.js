import React, { useMemo } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MultitrackMediaPlayer from '../../components/media-player/plyr/multitrack-media-player.js';

function MultitrackMediaDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { width, mainTrack, secondaryTracks, volumePresets } = content;

  const sources = useMemo(() => ({
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: getAccessibleUrl({
        url: mainTrack.sourceUrl,
        cdnRootUrl: clientConfig.cdnRootUrl
      })
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: getAccessibleUrl({
        url: track.sourceUrl,
        cdnRootUrl: clientConfig.cdnRootUrl
      })
    }))
  }), [mainTrack, secondaryTracks, clientConfig]);

  const combinedCopyrightNotice = [mainTrack.copyrightNotice, ...secondaryTracks.map(track => track.copyrightNotice)].filter(text => !!text).join('\n\n');

  return (
    <div className="MultitrackMediaDisplay">
      <div className={`MultitrackMediaDisplay-content u-width-${width || 100}`}>
        <MultitrackMediaPlayer
          showTrackMixer
          sources={sources}
          aspectRatio={mainTrack.aspectRatio}
          playbackRange={mainTrack.playbackRange}
          screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
          volumePresets={volumePresets}
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
