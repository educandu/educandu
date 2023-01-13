import PropTypes from 'prop-types';
import { useIsMounted } from '../../ui/hooks.js';
import Markdown from '../../components/markdown.js';
import React, { Fragment, useEffect, useRef } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { useService } from '../../components/container-context.js';
import AudioIcon from '../../components/icons/general/audio-icon.js';
import { RESOURCE_TYPE, SOURCE_TYPE } from '../../domain/constants.js';
import Html5Player from '../../components/media-player/plyr/html5-player.js';
import { getAccessibleUrl, getSourceType } from '../../utils/source-utils.js';
import YoutubePlayer from '../../components/media-player/plyr/youtube-player.js';

function MatchingCardsTileDisplay({ text, sourceUrl, playbackRange, playMedia }) {
  const playerRef = useRef();
  const isMounted = useIsMounted();
  const timeoutToPlayMedia = useRef();
  const clientConfig = useService(ClientConfig);

  const accessibleUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };

  useEffect(() => {
    clearTimeout(timeoutToPlayMedia.current);
    timeoutToPlayMedia.current = null;

    if (playerRef.current) {
      if (!playMedia) {
        playerRef.current.pause();
        return;
      }

      playerRef.current.seekToTimecode(0);
      timeoutToPlayMedia.current = setTimeout(() => {
        if (isMounted.current && playMedia) {
          playerRef.current.play();
        }
      }, 500);
    }
  }, [playerRef, playMedia, isMounted]);

  const renderMediaPlayer = audioOnly => {
    const sourceType = getSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const Player = sourceType === SOURCE_TYPE.youtube ? YoutubePlayer : Html5Player;

    return (
      <Player
        audioOnly={audioOnly}
        sourceUrl={accessibleUrl}
        playbackRange={playbackRange}
        playerRef={playerRef}
        />
    );
  };

  const renderMedia = () => {
    switch (resourceType) {
      case RESOURCE_TYPE.audio:
        return (
          <Fragment>
            {renderMediaPlayer(true)}
            <div className="MatchingCardsTileDisplay-audio"><AudioIcon /></div>
          </Fragment>
        );
      case RESOURCE_TYPE.video:
        return renderMediaPlayer(false);
      case RESOURCE_TYPE.image:
        return <img className="MatchingCardsTileDisplay-image" src={accessibleUrl} />;
      default:
        return null;
    }
  };

  return (
    <div className="MatchingCardsTileDisplay">
      <div>
        {!!text && (<div className="MatchingCardsTileDisplay-markdown"><Markdown>{text}</Markdown></div>)}
        {!!accessibleUrl && renderMedia()}
      </div>
      <div className="MatchingCardsTileDisplay-noInnerClickMask" />
    </div>
  );
}

MatchingCardsTileDisplay.propTypes = {
  playMedia: PropTypes.bool,
  text: PropTypes.string,
  sourceUrl: PropTypes.string,
  playbackRange: PropTypes.arrayOf(PropTypes.number)
};

MatchingCardsTileDisplay.defaultProps = {
  playMedia: false,
  text: '',
  sourceUrl: '',
  playbackRange: [0, 1]
};

export default MatchingCardsTileDisplay;
