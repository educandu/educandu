import PropTypes from 'prop-types';
import { useIsMounted } from '../../ui/hooks.js';
import Markdown from '../../components/markdown.js';
import { RESOURCE_TYPE } from '../../domain/constants.js';
import React, { Fragment, useEffect, useRef } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import AudioIcon from '../../components/icons/general/audio-icon.js';
import MediaPlayer from '../../components/media-player/media-player.js';

function MatchingCardsTileDisplay({ text, sourceUrl, playbackRange, playMedia }) {
  const mediaPlayerRef = useRef();
  const isMounted = useIsMounted();
  const timeoutToPlayMedia = useRef();
  const clientConfig = useService(ClientConfig);

  const accessibleUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };

  useEffect(() => {
    clearTimeout(timeoutToPlayMedia.current);
    timeoutToPlayMedia.current = null;

    if (mediaPlayerRef.current) {
      if (!playMedia) {
        mediaPlayerRef.current.pause();
        return;
      }

      mediaPlayerRef.current.seekToTimecode(0);
      timeoutToPlayMedia.current = setTimeout(() => {
        if (isMounted.current && playMedia) {
          mediaPlayerRef.current.play();
        }
      }, 500);
    }
  }, [mediaPlayerRef, playMedia, isMounted]);

  const renderMediaPlayer = audioOnly => {
    return (
      <MediaPlayer
        audioOnly={audioOnly}
        sourceUrl={accessibleUrl}
        renderControls={() => null}
        playbackRange={playbackRange}
        renderProgressBar={() => null}
        mediaPlayerRef={mediaPlayerRef}
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
