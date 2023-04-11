import PropTypes from 'prop-types';
import { useIsMounted } from '../../ui/hooks.js';
import Markdown from '../../components/markdown.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';

function MatchingCardsTileDisplay({ text, sourceUrl, playbackRange, playMedia }) {
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
