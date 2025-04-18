import React, { Fragment, useMemo } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { MULTITRACK_PLAYER_TYPE } from '../../domain/constants.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import DefaultMultitrackMediaPlayer from '../../components/media-player/default-multitrack-media-player.js';
import PreciseMultitrackMediaPlayer from '../../components/media-player/precise-multitrack-media-player.js';

function MultitrackMediaDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const { multitrackPlayerType, tracks, volumePresets, showVideo, aspectRatio, posterImage, width, initialVolume } = content;

  const sources = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    }));
  }, [tracks, clientConfig]);

  const combinedCopyrightNotice = tracks.map(track => track.copyrightNotice).filter(text => !!text).join('\n\n');

  const canRenderMediaPlayer = tracks.every(track => track.sourceUrl);

  return (
    <div className="MultitrackMediaDisplay">
      <div className={`MultitrackMediaDisplay-content u-width-${width || 100}`}>
        {!!canRenderMediaPlayer && (
          <Fragment>
            {multitrackPlayerType === MULTITRACK_PLAYER_TYPE.default && (
              <DefaultMultitrackMediaPlayer
                allowFullscreen
                allowLoop
                allowPlaybackRate
                aspectRatio={aspectRatio}
                initialVolume={initialVolume}
                posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
                showTrackMixer
                showVideo={showVideo}
                sources={sources}
                volumePresets={volumePresets}
                />
            )}
            {multitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise && (
              <PreciseMultitrackMediaPlayer
                allowLoop
                initialVolume={initialVolume}
                showTrackMixer
                sources={sources}
                volumePresets={volumePresets}
                />
            )}
            <CopyrightNotice value={combinedCopyrightNotice} />
          </Fragment>
        )}
      </div>
    </div>
  );
}

MultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MultitrackMediaDisplay;
