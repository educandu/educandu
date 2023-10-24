import { Button } from 'antd';
import PropTypes from 'prop-types';
import { useIsMounted } from '../../ui/hooks.js';
import Markdown from '../../components/markdown.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import StopIcon from '../../components/icons/media-player/stop-icon.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';

function MatchingCardsTileDisplay({ text, sourceUrl, playbackRange, playMedia, canTogglePlayMedia, onTogglePlayMedia }) {
  const mediaPlayerRef = useRef();
  const isMounted = useIsMounted();
  const timeoutToPlayMedia = useRef();
  const hasPlayedAtLeastOnce = useRef(false);
  const clientConfig = useService(ClientConfig);
  const [isMediaReady, setIsMediaReady] = useState(false);

  const accessibleUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };

  const handleMediaReady = () => {
    setIsMediaReady(true);
  };

  const handleMediaControlClick = event => {
    if (hasPlayedAtLeastOnce.current) {
      mediaPlayerRef.current.seekToTimecode(0);
    }
    onTogglePlayMedia(event);
  };

  useEffect(() => {
    clearTimeout(timeoutToPlayMedia.current);
    timeoutToPlayMedia.current = null;

    if (isMediaReady && isMounted.current) {
      if (!playMedia) {
        mediaPlayerRef.current.pause();
        return;
      }

      if (hasPlayedAtLeastOnce.current) {
        mediaPlayerRef.current.seekToTimecode(0);
      }

      timeoutToPlayMedia.current = setTimeout(() => {
        if (isMounted.current && playMedia) {
          mediaPlayerRef.current.play();
          hasPlayedAtLeastOnce.current = true;
        }
      }, 500);
    }
  }, [mediaPlayerRef, hasPlayedAtLeastOnce, isMediaReady, playMedia, isMounted]);

  const renderMediaPlayer = screenMode => {
    return (
      <MediaPlayer
        clickToPlay={false}
        screenMode={screenMode}
        sourceUrl={accessibleUrl}
        renderControls={() => null}
        playbackRange={playbackRange}
        renderProgressBar={() => null}
        mediaPlayerRef={mediaPlayerRef}
        onReady={handleMediaReady}
        />
    );
  };

  const renderMedia = () => {
    switch (resourceType) {
      case RESOURCE_TYPE.audio:
        return renderMediaPlayer(MEDIA_SCREEN_MODE.audio);
      case RESOURCE_TYPE.video:
        return renderMediaPlayer(MEDIA_SCREEN_MODE.video);
      case RESOURCE_TYPE.image:
        return <img className="MatchingCardsTileDisplay-image" src={accessibleUrl} />;
      default:
        return null;
    }
  };

  const renderMediaControlBar = () => {
    if (resourceType !== RESOURCE_TYPE.audio && resourceType !== RESOURCE_TYPE.video) {
      return null;
    }

    return (
      <div className="MatchingCardsTileDisplay-mediaControlBar">
        <Button
          icon={playMedia ? <StopIcon /> : <PlayIcon />}
          onClick={handleMediaControlClick}
          />
      </div>
    );
  };

  return (
    <div className="MatchingCardsTileDisplay">
      <div>
        {!!text && (<div className="MatchingCardsTileDisplay-markdown"><Markdown>{text}</Markdown></div>)}
        {!!accessibleUrl && renderMedia()}
      </div>
      <div className="MatchingCardsTileDisplay-surfaceOverlay">
        {!!canTogglePlayMedia && renderMediaControlBar()}
      </div>
    </div>
  );
}

MatchingCardsTileDisplay.propTypes = {
  canTogglePlayMedia: PropTypes.bool,
  onTogglePlayMedia: PropTypes.func,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playMedia: PropTypes.bool,
  sourceUrl: PropTypes.string,
  text: PropTypes.string
};

MatchingCardsTileDisplay.defaultProps = {
  canTogglePlayMedia: false,
  onTogglePlayMedia: () => {},
  playbackRange: [0, 1],
  playMedia: false,
  sourceUrl: '',
  text: ''
};

export default MatchingCardsTileDisplay;
