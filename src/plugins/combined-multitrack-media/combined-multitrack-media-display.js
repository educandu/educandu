import classNames from 'classnames';
import { useIsMounted } from '../../ui/hooks.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function CombinedMultitrackMediaDisplay({ content }) {
  const isMounted = useIsMounted();
  const clientConfig = useService(ClientConfig);

  const { note, width, player1, player2 } = content;
  const [canRenderMediaPlayers, setCanRenderMediaPlayers] = useState(false);
  const [combinedCopyrightNotice, setCombinedCopyrightNotice] = useState('');

  useEffect(() => {
    const allTracks = [player1.track, ...player2.tracks];
    setCanRenderMediaPlayers(isMounted && allTracks.every(track => track.sourceUrl));
    setCombinedCopyrightNotice(allTracks.map(track => track.copyrightNotice).filter(text => !!text).join('\n\n'));
  }, [player1, player2, isMounted]);

  const player1Source = getAccessibleUrl({ url: player1.track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const player2Sources = player2.tracks.map(track => ({
    ...track,
    sourceUrl: getAccessibleUrl({ url: track.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
  }));
  const posterImageUrl = getAccessibleUrl({ url: player1.posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="CombinedMultitrackMediaDisplay">
      <div className={`CombinedMultitrackMediaDisplay-content u-width-${width || 100}`}>
        {!!canRenderMediaPlayers && !!isMounted && (
          <Fragment>
            <div className={classNames('CombinedMultitrackMediaDisplay-player1', { 'CombinedMultitrackMediaDisplay-player1--noScreen': !player1.showVideo })}>
              <MediaPlayer
                screenMode={player1.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
                aspectRatio={player1.aspectRatio}
                initialVolume={player1.initialVolume}
                playbackRange={player1.playbackRange}
                posterImageUrl={posterImageUrl}
                sourceUrl={player1Source}
                />
            </div>
            <div className="CombinedMultitrackMediaDisplay-note">
              <Markdown inline>{note}</Markdown>
            </div>
            <div className="CombinedMultitrackMediaDisplay-player2">
              <MultitrackMediaPlayer
                initialVolume={player2.initialVolume}
                showTrackMixer
                showVideo={false}
                sources={player2Sources}
                volumePresets={player2.volumePresets}
                />
            </div>
            <CopyrightNotice value={combinedCopyrightNotice} />
          </Fragment>
        )}
      </div>
    </div>
  );
}

CombinedMultitrackMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default CombinedMultitrackMediaDisplay;
